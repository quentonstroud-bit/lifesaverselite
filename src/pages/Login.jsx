import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, KeyRound, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INPUT = 'bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary w-full'

export function homeFor(role) {
  return role === 'lifesaver' ? '/dashboard/lifesaver' : role === 'agent' ? '/dashboard/agent' : '/dashboard/admin'
}

export default function Login() {
  const { requestLink, loginPassword } = useAuth()
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('link')   // 'link' | 'password'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [sent,     setSent]     = useState(false)

  async function handleLink(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const r = await requestLink(email.trim())
    setLoading(false)
    if (r.success) setSent(true)
    else setError(r.error)
  }

  async function handlePassword(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const r = await loginPassword(email.trim(), password)
    setLoading(false)
    if (r.success) navigate(homeFor(r.role))
    else setError(r.error)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">LS</span>
          </div>
          <span className="text-white font-bold text-xl">LifeSaversElite</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-gray-400 text-sm mb-6">
              If <span className="text-white">{email}</span> has an account, a sign-in link is on its way. It works once and expires in 15 minutes.
            </p>
            <button onClick={() => { setSent(false); setError('') }} className="text-primary text-sm hover:underline">Use a different email</button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-center text-sm mb-6">Sign in to your account</p>

            <div className="grid grid-cols-2 gap-2 mb-6 bg-bg rounded-xl p-1">
              {[['link', 'Email me a link', Mail], ['password', 'Use password', KeyRound]].map(([key, label, Icon]) => (
                <button key={key} type="button" onClick={() => { setMode(key); setError('') }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors ${mode === key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'link' ? handleLink : handlePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-300 text-sm font-medium">Email Address</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required className={INPUT} />
              </div>

              {mode === 'password' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 text-sm font-medium">Password</label>
                  <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" required className={INPUT} />
                  <p className="text-xs text-gray-500">No password yet? Sign in with an email link, then set one in Settings.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors mt-2">
                {loading ? 'Please wait...' : mode === 'link' ? 'Email me a sign-in link' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Not a member yet?{' '}
              <a href="/apply" className="text-primary hover:underline">Apply to join</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
