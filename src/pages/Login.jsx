import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState('lifesaver')

  function handleLogin() {
    login(selected)
    if (selected === 'lifesaver') navigate('/dashboard/lifesaver')
    else if (selected === 'agent') navigate('/dashboard/agent')
    else navigate('/dashboard/admin')
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

        <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Sign in to your account</p>

        <div className="flex flex-col gap-3 mb-6">
          <label className="text-gray-300 text-sm font-medium">Email Address</label>
          <input
            type="email"
            placeholder="you@email.com"
            className="bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
          <label className="text-gray-300 text-sm font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Demo role selector */}
        <div className="bg-bg border border-gray-700 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Demo: Select Role</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'lifesaver', label: 'LifeSaver' },
              { key: 'agent', label: 'Agent' },
              { key: 'admin', label: 'Admin' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  selected === key ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleLogin} className="w-full bg-primary hover:bg-red-700 text-white font-semibold py-4 rounded-xl transition-colors">
          Sign In
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Not a member yet?{' '}
          <a href="/apply" className="text-primary hover:underline">Apply to join</a>
        </p>
      </div>
    </div>
  )
}
