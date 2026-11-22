// POST /api/checkout  { leadId }  (agent must be signed in)  ->  { url } (Stripe Checkout) or { free: true }
// The amount is NEVER taken from the browser: the price comes from the Apps Script backend,
// which computes it from the lead's star rating.

import { getSession, sameOrigin } from './_lib/session.js'
import { lookupUser } from './_lib/gas.js'

const STRIPE = 'https://api.stripe.com/v1'

function env() {
  return {
    key: process.env.STRIPE_SECRET_KEY,
    webapp: process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL,
    serverKey: process.env.SERVER_KEY,
    site: process.env.SITE_URL,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { key, webapp, serverKey, site } = env()
  if (!key || !webapp || !serverKey) return res.status(500).json({ error: 'Payments are not configured' })

  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Please sign in.' })
  let agent
  try { agent = await lookupUser(session.email) } catch { return res.status(502).json({ error: 'Could not reach the lead service' }) }
  if (!agent || agent.role !== 'agent') return res.status(403).json({ error: 'Only agents can buy leads' })
  const agentEmail = agent.email   // identity comes from the session, never from the request

  const { leadId } = req.body || {}
  if (typeof leadId !== 'string' || !/^LD-\d+$/.test(leadId)) return res.status(400).json({ error: 'Invalid lead' })

  let quote
  try {
    const qs = new URLSearchParams({ query: 'lead_quote', leadId, agentEmail, key: serverKey })
    const r = await fetch(`${webapp}?${qs}`)
    quote = await r.json()
  } catch {
    return res.status(502).json({ error: 'Could not reach the lead service' })
  }
  if (!quote.ok) return res.status(409).json({ error: quote.error || 'Lead is not available' })
  if (!(quote.total > 0)) return res.json({ free: true })

  const origin = site || `https://${req.headers.host}`
  const cents = (n) => Math.round(n * 100)
  const p = new URLSearchParams()
  p.set('mode', 'payment')
  p.set('success_url', `${origin}/dashboard/agent?purchase=success`)
  p.set('cancel_url', `${origin}/dashboard/agent?purchase=cancelled`)
  p.set('customer_email', agentEmail)
  p.set('client_reference_id', leadId)
  p.set('metadata[leadId]', leadId)
  p.set('metadata[agentEmail]', agentEmail)
  p.set('payment_intent_data[metadata][leadId]', leadId)
  p.set('payment_intent_data[metadata][agentEmail]', agentEmail)   // lets refunds be matched to the agent
  p.set('line_items[0][quantity]', '1')
  p.set('line_items[0][price_data][currency]', 'usd')
  p.set('line_items[0][price_data][unit_amount]', String(cents(quote.price)))
  p.set('line_items[0][price_data][product_data][name]', `Lead ${leadId} (${quote.stars}-star)`)
  p.set('line_items[1][quantity]', '1')
  p.set('line_items[1][price_data][currency]', 'usd')
  p.set('line_items[1][price_data][unit_amount]', String(cents(quote.fee)))
  p.set('line_items[1][price_data][product_data][name]', 'LifeSavers Elite service fee')

  const r = await fetch(`${STRIPE}/checkout/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p,
  })
  const stripeSession = await r.json()
  if (!r.ok || !stripeSession.url) return res.status(502).json({ error: 'Could not start checkout' })
  return res.json({ url: stripeSession.url })
}
