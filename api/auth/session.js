// GET -> { user } for the signed-in session (re-checked against the Sheet so removed accounts lose access), or { user: null }.
import { getSession, clearSessionCookie } from '../_lib/session.js'
import { gasGet, lookupUser } from '../_lib/gas.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const s = getSession(req)
  if (!s) return res.json({ user: null })
  try {
    const user = await lookupUser(s.email)
    if (!user) { clearSessionCookie(req, res); return res.json({ user: null }) }
    const cred = await gasGet('auth_credential', { email: user.email })
    return res.json({ user: { ...user, hasPassword: !!cred.found } })
  } catch {
    return res.status(502).json({ error: 'Could not reach the server.' })
  }
}
