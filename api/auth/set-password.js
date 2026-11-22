// POST { password } (signed in) -> sets or changes the password used for password sign-in.
import { getSession, sameOrigin } from '../_lib/session.js'
import { gasPost, lookupUser } from '../_lib/gas.js'
import { hashPassword, validNewPassword } from '../_lib/passwords.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  const s = getSession(req)
  if (!s) return res.status(401).json({ error: 'Please sign in first.' })
  const password = req.body?.password
  if (!validNewPassword(password)) return res.status(400).json({ error: 'Use at least 10 characters.' })
  try {
    const user = await lookupUser(s.email)
    if (!user) return res.status(401).json({ error: 'Please sign in again.' })
    const r = await gasPost('auth_set_credential', { email: user.email, hash: await hashPassword(password) })
    if (r.status !== 200) return res.status(502).json({ error: 'Could not save password.' })
    return res.json({ ok: true })
  } catch {
    return res.status(502).json({ error: 'Could not save password.' })
  }
}
