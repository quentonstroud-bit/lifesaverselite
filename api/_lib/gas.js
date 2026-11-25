// Server-to-server calls to the Google Apps Script backend, always with the shared SERVER_KEY.
function cfg() {
  const url = process.env.WEBAPP_URL || process.env.VITE_WEBAPP_URL
  const key = process.env.SERVER_KEY
  if (!url || !key) throw new Error('Backend not configured')
  return { url, key }
}

export async function gasGet(query, params = {}) {
  const { url, key } = cfg()
  const qs = new URLSearchParams({ ...params, query, key })
  const r = await fetch(`${url}?${qs}`, { signal: AbortSignal.timeout(25000) })
  return r.json()
}

export async function gasPost(formType, body = {}) {
  const { url, key } = cfg()
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ ...body, formType, serverKey: key }),
    signal: AbortSignal.timeout(25000),
  })
  return r.json()
}

// Error thrown when Apps Script answers with an error instead of data (for example a SERVER_KEY mismatch).
// `code` is safe to show; the detail goes to the Vercel function logs.
export class BackendError extends Error {
  constructor(code, detail) { super(detail); this.code = code }
}

// Counts one attempt against `key`. true = allowed, false = over the limit.
// Anything else from Apps Script is a setup problem and is thrown, never reported as "too many requests".
export async function throttle(key, limit, windowSec) {
  let r
  try {
    r = await gasPost('auth_throttle', { key, limit, windowSec })
  } catch (e) {
    console.error('[backend] auth_throttle unreachable or not JSON (check WEBAPP_URL is the /exec web app URL):', e.message)
    throw new BackendError('backend-unreachable', e.message)
  }
  if (typeof r?.allowed === 'boolean') return r.allowed
  const code = r?.status === 403 ? 'backend-key-mismatch' : 'backend-error'
  console.error(`[backend] auth_throttle answered ${JSON.stringify(r)}`
    + (code === 'backend-key-mismatch' ? ' -> SERVER_KEY in Vercel and the SERVER_KEY Script Property in Apps Script do not match' : ''))
  throw new BackendError(code, r?.message || 'unexpected answer')
}

export function backendErrorResponse(res, e) {
  return res.status(503).json({ error: `Sign-in is temporarily unavailable because of a server setup problem (${e.code}). Please try again later.`, code: e.code })
}

export async function lookupUser(email) {
  const r = await gasGet('auth_lookup', { email })
  return r.user || null
}
