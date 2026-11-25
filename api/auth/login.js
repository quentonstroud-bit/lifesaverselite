// POST { email, password } -> session cookie. Generic error for every failure; throttled per email and per IP.
import { setSessionCookie, sameOrigin, clientIp } from '../_lib/session.js'
import { gasGet, lookupUser, throttle, BackendError, backendErrorResponse } from '../_lib/gas.js'
import { verifyPassword } from '../_lib/passwords.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  const email = String(req.body?.email || '').toLowerCase().trim()
  const password = String(req.body?.password || '')
  const fail = () => res.status(401).json({ error: 'Invalid email or password.' })
  if (!email || !password || password.length > 200) return fail()

  try {
    const [byEmail, byIp] = await Promise.all([
      throttle(`pw:${email}`, 8, 900),
      throttle(`pwip:${clientIp(req)}`, 30, 900),
    ])
    if (!byEmail || !byIp) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes, or use an email link.' })

    const cred = await gasGet('auth_credential', { email })
    const ok = await verifyPassword(password, cred.found ? cred.hash : null)
    const user = ok ? await lookupUser(email) : null
    if (!user) return fail()
    setSessionCookie(req, res, user)
    return res.json({ user })
  } catch (e) {
    if (e instanceof BackendError) return backendErrorResponse(res, e)
    console.error('[login]', e.message)
    return res.status(502).json({ error: 'Could not sign you in. Try again.' })
  }
}
