import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

// Training / IC-agreement progress is a convenience flag kept per email in this browser.
// (It is not a security control; the server never relies on it.)
const flagKey = (email) => `lse_flags:${(email || '').toLowerCase()}`
function loadFlags(email) { try { return JSON.parse(localStorage.getItem(flagKey(email)) || '{}') } catch { return {} } }
function saveFlags(email, flags) { try { localStorage.setItem(flagKey(email), JSON.stringify(flags)) } catch { /* ignore */ } }

async function post(path, body) {
  const r = await fetch(path, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  })
  let data = {}
  try { data = await r.json() } catch { /* ignore */ }
  return { ok: r.ok, status: r.status, data }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const withFlags = (u) => (u ? { ...u, icSigned: false, trainingComplete: false, ...loadFlags(u.email) } : null)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' })
      const d = await r.json()
      setUser(withFlags(d.user))
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Any API call that comes back 401 means the session ended: drop to the login screen.
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('lse:unauthorized', onUnauthorized)
    return () => window.removeEventListener('lse:unauthorized', onUnauthorized)
  }, [])

  // Emails a single-use sign-in link. Resolves { success } (the server answers the same for unknown emails).
  async function requestLink(email) {
    const { ok, data } = await post('/api/auth/request-link', { email })
    return ok ? { success: true } : { success: false, error: data.error || 'Could not send the link.' }
  }

  async function verifyToken(token) {
    const { ok, data } = await post('/api/auth/verify', { token })
    if (!ok) return { success: false, error: data.error || 'This link is invalid or has expired.' }
    setUser(withFlags(data.user))
    return { success: true, role: data.user.role }
  }

  async function loginPassword(email, password) {
    const { ok, data } = await post('/api/auth/login', { email, password })
    if (!ok) return { success: false, error: data.error || 'Sign-in failed.' }
    setUser(withFlags(data.user))
    return { success: true, role: data.user.role }
  }

  async function setPassword(password) {
    const { ok, data } = await post('/api/auth/set-password', { password })
    if (ok) setUser((u) => (u ? { ...u, hasPassword: true } : u))
    return ok ? { success: true } : { success: false, error: data.error || 'Could not save password.' }
  }

  async function logout() {
    await post('/api/auth/logout')
    setUser(null)
  }

  function updateFlags(patch) {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      saveFlags(prev.email, { icSigned: next.icSigned, trainingComplete: next.trainingComplete })
      return next
    })
  }
  const signIcAgreement = () => updateFlags({ icSigned: true })
  const completeTraining = () => updateFlags({ trainingComplete: true })

  return (
    <AuthContext.Provider value={{ user, loading, requestLink, verifyToken, loginPassword, setPassword, logout, signIcAgreement, completeTraining }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
