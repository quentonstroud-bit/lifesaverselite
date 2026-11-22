import { clearSessionCookie, sameOrigin } from '../_lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Forbidden' })
  clearSessionCookie(req, res)
  return res.json({ ok: true })
}
