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

export async function lookupUser(email) {
  const r = await gasGet('auth_lookup', { email })
  return r.user || null
}
