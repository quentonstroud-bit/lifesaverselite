import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeFor } from './Login'

// The email link opens this page; signing in needs a deliberate click so mail scanners that
// pre-fetch links cannot use up the single-use token.
export default function VerifyLink() {
  const { verifyToken } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function go() {
    setLoading(true); setError('')
    const r = await verifyToken(token)
    setLoading(false)
    if (r.success) navigate(homeFor(r.role), { replace: true })
    else setError(r.error)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to LifeSavers Elite</h1>
        {!token ? (
          <p className="text-red-400 text-sm mt-4">This link is incomplete. <Link to="/login" className="underline">Request a new one</Link>.</p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-6">Click below to finish signing in on this device.</p>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{error} <Link to="/login" className="underline">Request a new link</Link></p>
              </div>
            )}
            <button onClick={go} disabled={loading}
              className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
