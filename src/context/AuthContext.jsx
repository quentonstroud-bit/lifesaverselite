import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const ADMIN_EMAIL    = 'reverendqs@gmail.com'
const ADMIN_PASSWORD = 'TopAgent5661421$'
const WEBAPP_URL     = import.meta.env.VITE_WEBAPP_URL || ''

function saveSession(u) { try { localStorage.setItem('lse_user', JSON.stringify(u)) } catch {} }
function clearSession()  { try { localStorage.removeItem('lse_user') } catch {} }
function loadSession()   { try { const s = localStorage.getItem('lse_user'); return s ? JSON.parse(s) : null } catch { return null } }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession())

  async function login(email, password) {
    const em = (email || '').toLowerCase().trim()

    // Admin: hardcoded credentials
    if (em === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
      const u = { id: 'adm1', name: 'Quenton Stroud', email: 'reverendqs@gmail.com', role: 'admin' }
      setUser(u); saveSession(u)
      return { success: true, role: 'admin' }
    }

    if (!WEBAPP_URL) return { success: false, error: 'Backend not configured.' }

    try {
      const res  = await fetch(`${WEBAPP_URL}?query=validate_login&email=${encodeURIComponent(em)}`)
      const data = await res.json()
      if (data.status === 200 && data.role) {
        const u = { ...data, icSigned: false, trainingComplete: false }
        setUser(u); saveSession(u)
        return { success: true, role: data.role }
      }
      return { success: false, error: 'No account found for that email.' }
    } catch {
      return { success: false, error: 'Connection error. Please try again.' }
    }
  }

  // Used after enrollment — skip backend round-trip
  function loginDirect(userData) {
    const u = { ...userData, icSigned: false, trainingComplete: false }
    setUser(u); saveSession(u)
  }

  function logout() {
    setUser(null); clearSession()
  }

  function signIcAgreement() {
    setUser(prev => { const u = { ...prev, icSigned: true }; saveSession(u); return u })
  }

  function completeTraining() {
    setUser(prev => { const u = { ...prev, trainingComplete: true }; saveSession(u); return u })
  }

  return (
    <AuthContext.Provider value={{ user, login, loginDirect, logout, signIcAgreement, completeTraining }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
