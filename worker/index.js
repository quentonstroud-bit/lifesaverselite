// LifeSavers Elite Worker: serves /api/* and runs scheduled jobs.
// Static pages in ./site are served by Cloudflare directly (see wrangler.jsonc).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  if (type.includes('form')) return Object.fromEntries(await request.formData());
  return {};
}

// ---- Email (Resend) -------------------------------------------------------
async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set; skipping email to', to);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error('Resend failed', res.status, await res.text());
  return res.ok;
}

const wrapEmail = (body) =>
  `<div style="background:#0b0a0c;color:#fff;font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden">` +
  `<div style="background:#8b0f24;padding:24px 32px"><h1 style="margin:0;font-size:20px;color:#fff">LifeSavers Elite</h1></div>` +
  `<div style="padding:32px">${body}<hr style="border-color:#2a2326;margin:32px 0">` +
  `<p style="color:#9a9094;font-size:12px">Sincerely,<br><strong>Quenton Stroud</strong><br>Executive Manager, LifeSavers Elite</p></div></div>`;

// ---- POST /api/apply ------------------------------------------------------
async function handleApply(request, env, ctx) {
  const d = await readBody(request);
  if (d._gotcha) return json({ ok: true }); // honeypot: pretend success to bots
  const name = String(d.full_name || '').trim().slice(0, 120);
  const email = String(d.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(d.phone || '').trim().slice(0, 40);
  const carrier = String(d.current_carrier || '').trim().slice(0, 120);
  if (!name || !isEmail(email) || phone.length < 7) return json({ ok: false, error: 'Please check your name, email and phone.' }, 400);

  await env.DB.prepare('INSERT INTO lifesaver_applications (full_name, email, phone, current_carrier) VALUES (?, ?, ?, ?)')
    .bind(name, email, phone, carrier || null).run();

  const first = esc(name.split(' ')[0]);
  ctx.waitUntil(Promise.all([
    sendEmail(env, env.ADMIN_EMAIL, `New LifeSavers Application - ${name}`, wrapEmail(
      `<h2 style="color:#c9a45c">New LifeSaver Application</h2><p><strong>Name:</strong> ${esc(name)}</p>` +
      `<p><strong>Email:</strong> ${esc(email)}</p><p><strong>Phone:</strong> ${esc(phone)}</p>` +
      `<p><strong>Current carrier:</strong> ${esc(carrier) || 'n/a'}</p>`)),
    sendEmail(env, email, `You're One Step Closer, ${name.split(' ')[0]}`, wrapEmail(
      `<h2 style="color:#c9a45c">You are one step closer, ${first}.</h2>` +
      `<p>Thank you for applying to LifeSavers Elite. Our team will reach out within 24 hours.</p>` +
      `<p>Book your interview now to move to priority review.</p>` +
      `<p style="text-align:center;margin:32px 0"><a href="${esc(env.CAL_URL)}" style="background:#8b0f24;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Book Your Interview</a></p>`)),
  ]));
  return json({ ok: true });
}

// ---- POST /api/stripe/webhook --------------------------------------------
async function verifyStripe(payload, header, secret) {
  const parts = Object.fromEntries((header || '').split(',').map((p) => p.split('=')));
  const t = parts.t, sig = parts.v1;
  if (!t || !sig || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function handleStripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: 'Webhook not configured' }, 503);
  const payload = await request.text();
  if (!(await verifyStripe(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET)))
    return json({ ok: false, error: 'Bad signature' }, 400);
  const event = JSON.parse(payload);
  // Store once; Stripe retries are ignored. Event-specific handling (subscriptions,
  // top-ups -> transactions) is added once the Stripe products exist.
  await env.DB.prepare('INSERT OR IGNORE INTO stripe_events (id, type, payload) VALUES (?, ?, ?)')
    .bind(event.id, event.type, payload).run();
  return json({ received: true });
}

// ---- Cron: release expired leads -----------------------------------------
async function releaseExpiredLeads(env) {
  const res = await env.DB.prepare(
    "UPDATE leads SET status = 'POOL', pool_source = '48hr window expired - auto-released' " +
    "WHERE status = 'PENDING' AND expiry IS NOT NULL AND expiry < ?"
  ).bind(new Date().toISOString()).run();
  console.log('Released expired leads:', res.meta?.changes ?? 0);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/health') return json({ ok: true });
      if (pathname === '/api/apply' && request.method === 'POST') return await handleApply(request, env, ctx);
      if (pathname === '/api/stripe/webhook' && request.method === 'POST') return await handleStripeWebhook(request, env);
      if (pathname.startsWith('/api/')) return json({ ok: false, error: 'Not found' }, 404);
    } catch (err) {
      console.error(err);
      return json({ ok: false, error: 'Server error' }, 500);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(releaseExpiredLeads(env));
  },
};
