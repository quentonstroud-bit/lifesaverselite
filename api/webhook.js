// POST /api/webhook  - Stripe webhook. Verifies the signature, reads the real Stripe fee,
// then tells the Apps Script backend to record the purchase and unlock the lead.
import crypto from 'node:crypto'

const STRIPE = 'https://api.stripe.com/v1'

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export function verifySignature(raw, header, secret, now = Date.now()) {
  if (!header || !secret) return false
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')))
  const t = parts.t
  const sigs = header.split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3))
  if (!t || !sigs.length) return false
  if (Math.abs(now / 1000 - Number(t)) > 300) return false // 5 minute tolerance
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw.toString('utf8')}`).digest('hex')
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webapp = process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL
  const serverKey = process.env.SERVER_KEY
  if (!secret || !stripeKey || !webapp || !serverKey) return res.status(500).end()

  const raw = await readRaw(req)
  if (!verifySignature(raw, req.headers['stripe-signature'], secret)) return res.status(400).send('Bad signature')

  const event = JSON.parse(raw.toString('utf8'))
  const post = (body) => fetch(webapp, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ ...body, serverKey }),
  })

  // A refund issued in the Stripe dashboard (or API) flows back into the ledger automatically.
  if (event.type === 'charge.refunded') {
    const ch = event.data.object
    let meta = ch.metadata || {}
    if (!meta.leadId && ch.payment_intent) {
      try {
        const r = await fetch(`${STRIPE}/payment_intents/${ch.payment_intent}`, { headers: { Authorization: `Bearer ${stripeKey}` } })
        meta = (await r.json())?.metadata || {}
      } catch { /* record without lead details */ }
    }
    const r = await post({
      formType: 'refund_recorded',
      chargeId: ch.id,
      paymentIntent: ch.payment_intent,
      amountRefunded: ch.amount_refunded,   // running total for this charge
      leadId: meta.leadId,
      agentEmail: meta.agentEmail,
    })
    if (!r.ok) return res.status(502).end()
    return res.json({ received: true })
  }

  if (event.type !== 'checkout.session.completed') return res.json({ received: true })

  const s = event.data.object
  if (s.payment_status !== 'paid') return res.json({ received: true })

  // Real processing fee from Stripe (falls back to the backend's estimate if unavailable)
  let stripeFee = ''
  try {
    const r = await fetch(`${STRIPE}/payment_intents/${s.payment_intent}?expand[]=latest_charge.balance_transaction`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    })
    const pi = await r.json()
    const fee = pi?.latest_charge?.balance_transaction?.fee
    if (typeof fee === 'number') stripeFee = fee / 100
  } catch { /* use fallback */ }

  const r = await post({
    formType: 'payment_complete',
    sessionId: s.id,
    paymentIntent: s.payment_intent,
    leadId: s.metadata?.leadId,
    agentEmail: s.metadata?.agentEmail,
    amountTotal: s.amount_total,
    stripeFee,
  })
  if (!r.ok) return res.status(502).end() // Stripe will retry

  return res.json({ received: true })
}
