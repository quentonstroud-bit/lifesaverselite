// Signed session cookies (HMAC-SHA256). No third-party deps.
import crypto from 'node:crypto'

export const COOKIE = 'lse_session'

const b64u = (v) => Buffer.from(v).toString('base64url')

export function sign(payload, secret) {
  const body = b64u(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verify(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || !secret) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let payload
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) } catch { return null }
  if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 < now) return null
  return payload
}

export function parseCookies(header = '') {
  const out = {}
  header.split(';').forEach((p) => {
    const i = p.indexOf('=')
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim())
  })
  return out
}

function cookieString(value, maxAge, req) {
  const local = /^(localhost|127\.0\.0\.1)/.test(req?.headers?.host || '')
  return `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${local ? '' : '; Secure'}`
}

export function setSessionCookie(req, res, user, now = Date.now()) {
  const ttl = user.role === 'admin' ? 12 * 3600 : 7 * 24 * 3600
  const token = sign({ email: user.email, role: user.role, exp: Math.floor(now / 1000) + ttl }, process.env.SESSION_SECRET)
  res.setHeader('Set-Cookie', cookieString(token, ttl, req))
}

export function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', cookieString('', 0, req))
}

// Returns { email, role } or null. Role here is only a hint; callers re-check via lookupUser.
export function getSession(req) {
  const t = parseCookies(req.headers.cookie || '')[COOKIE]
  return verify(t, process.env.SESSION_SECRET)
}

// CSRF defence in depth: JSON-only + same-origin for state-changing calls (cookie is also SameSite=Lax).
export function sameOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true // same-origin fetches from some browsers omit Origin on GET
  try {
    const host = new URL(origin).host
    const site = process.env.SITE_URL ? new URL(process.env.SITE_URL).host : null
    return host === req.headers.host || host === site
  } catch { return false }
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
}
