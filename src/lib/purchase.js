// Starts a lead purchase. Paid leads go to Stripe Checkout (price is computed server-side);
// free (1-star) leads are unlocked directly through the backend.
const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export const money = (n) => `$${Number(n || 0).toFixed(2)}`

// Resolves { redirected: true } (browser is leaving for Stripe), { free: true }, or throws Error(message).
export async function startPurchase(lead, agentEmail) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId: lead.id, agentEmail }),
  })
  let data = {}
  try { data = await res.json() } catch { /* ignore */ }
  if (!res.ok) throw new Error(data.error || 'Could not start checkout')

  if (data.url) {
    window.location.href = data.url
    return { redirected: true }
  }
  if (data.free) {
    if (!WEBAPP_URL) throw new Error('Backend not configured')
    await fetch(WEBAPP_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ formType: 'lead_accept', leadId: lead.id, agentEmail }),
    })
    return { free: true }
  }
  throw new Error('Unexpected response')
}

// Reads ?purchase=success|cancelled once after returning from Stripe, then cleans the URL.
export function readPurchaseResult() {
  try {
    const p = new URLSearchParams(window.location.search).get('purchase')
    if (p) window.history.replaceState({}, '', window.location.pathname)
    return p
  } catch { return null }
}
