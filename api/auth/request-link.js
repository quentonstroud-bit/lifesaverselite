// POST { email } -> emails a single-use sign-in link. Always answers the same, so it never reveals which emails have accounts.
import crypto from 'node:crypto'
import { sign, sameOrigin, clientIp } from '../_lib/session.js'
import { gasPost, lookupUser } from '../_lib/gas.js'

const EMAIL = /^[^@\s]{1,100}@[^@\s]{1,100}\.[^@\s]{1,20}$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  const email = String(req.body?.email || '').toLowerCase().trim()
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address' })

  try {
    const [byEmail, byIp] = await Promise.all([
      gasPost('auth_throttle', { key: `link:${email}`, limit: 5, windowSec: 3600 }),
      gasPost('auth_throttle', { key: `linkip:${clientIp(req)}`, limit: 20, windowSec: 3600 }),
    ])
    if (!byEmail.allowed || !byIp.allowed) return res.status(429).json({ error: 'Too many requests. Try again later.' })

    const user = await lookupUser(email)
    if (user) {
      const site = process.env.SITE_URL || `https://${req.headers.host}`
      const token = sign({ typ: 'magic', email, jti: crypto.randomUUID(), exp: Math.floor(Date.now() / 1000) + 15 * 60 }, process.env.SESSION_SECRET)
      await gasPost('send_magic_link', { email, link: `${site}/auth/verify?token=${encodeURIComponent(token)}` })
    }
  } catch {
    return res.status(502).json({ error: 'Could not send the link. Try again.' })
  }
  return res.json({ ok: true })
}
