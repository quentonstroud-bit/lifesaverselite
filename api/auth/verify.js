// POST { token } -> trades a magic-link token for a session cookie. Called from the /auth/verify page
// (a button click), so email security scanners that merely open the link cannot burn the token.
import { verify, setSessionCookie, sameOrigin } from '../_lib/session.js'
import { gasPost, lookupUser } from '../_lib/gas.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  const claims = verify(req.body?.token, process.env.SESSION_SECRET)
  if (!claims || claims.typ !== 'magic' || !claims.jti) return res.status(400).json({ error: 'This link is invalid or has expired.' })

  try {
    const used = await gasPost('auth_consume', { jti: claims.jti })
    if (!used.ok) return res.status(400).json({ error: 'This link was already used. Request a new one.' })
    const user = await lookupUser(claims.email)
    if (!user) return res.status(400).json({ error: 'No account found.' })
    setSessionCookie(req, res, user)
    return res.json({ user })
  } catch {
    return res.status(502).json({ error: 'Could not sign you in. Try again.' })
  }
}
