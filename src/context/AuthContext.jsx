import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Demo users for development
const DEMO_USERS = {
  lifesaver: { id: 'ls1', name: 'Jordan Smith', handle: '@jordansmith', role: 'lifesaver', tier: 'Star 3', icSigned: false, trainingComplete: false },
  agent:     { id: 'ag1', name: 'Marcus Rivera', agency: 'Rivera Insurance Group', role: 'agent', icSigned: true },
  admin:     { id: 'adm1', name: 'Quenton Stroud', role: 'admin' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  function login(role) {
    setUser(DEMO_USERS[role])
  }

  function logout() {
    setUser(null)
  }

  function signIcAgreement() {
    setUser(prev => ({ ...prev, icSigned: true }))
  }

  function completeTraining() {
    setUser(prev => ({ ...prev, trainingComplete: true }))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signIcAgreement, completeTraining }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
