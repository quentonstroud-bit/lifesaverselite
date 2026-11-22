// Starts a lead purchase. Paid leads go to Stripe Checkout (price is computed server-side);
// free (1-star) leads are unlocked directly through the backend.
import { apiPost } from './api'

export const money = (n) => `$${Number(n || 0).toFixed(2)}`

// Resolves { redirected: true } (browser is leaving for Stripe), { free: true }, or throws Error(message).
export async function startPurchase(lead) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId: lead.id }),   // who is buying comes from the session, not the request
  })
  let data = {}
  try { data = await res.json() } catch { /* ignore */ }
  if (!res.ok) throw new Error(data.error || 'Could not start checkout')

  if (data.url) {
    window.location.href = data.url
    return { redirected: true }
  }
  if (data.free) {
    await apiPost('lead_accept', { leadId: lead.id })
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
