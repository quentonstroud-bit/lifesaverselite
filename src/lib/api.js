// All data calls go through the authenticated gateway (/api/gw). The browser never talks to the
// Google Apps Script backend directly, and identity (who you are) comes from your session cookie.
async function call(body) {
  const r = await fetch('/api/gw', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = {}
  try { data = await r.json() } catch { /* non-JSON error page */ }
  if (r.status === 401) window.dispatchEvent(new Event('lse:unauthorized'))
  if (!r.ok) {
    const err = new Error(data.error || data.message || 'Request failed')
    err.status = r.status
    err.data = data
    throw err
  }
  return data
}

export const apiGet  = (query, params) => call({ type: 'get', query, params })
export const apiPost = (formType, fields = {}) => call({ type: 'post', formType, ...fields })
