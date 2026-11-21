import React, { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Optional: lets a signed-in user add a password so they can sign in without waiting for an email.
export default function PasswordCard() {
  const { user, setPassword } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    setMsg(null)
    if (pw.length < 10) return setMsg({ ok: false, text: 'Use at least 10 characters.' })
    if (pw !== pw2) return setMsg({ ok: false, text: 'Passwords do not match.' })
    setBusy(true)
    const r = await setPassword(pw)
    setBusy(false)
    if (r.success) { setPw(''); setPw2(''); setMsg({ ok: true, text: 'Password saved. You can now sign in with it.' }) }
    else setMsg({ ok: false, text: r.error })
  }

  const input = 'w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary'
  return (
    <form onSubmit={save} className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-gray-400" />
        <p className="font-bold text-sm">{user?.hasPassword ? 'Change password' : 'Set a password (optional)'}</p>
      </div>
      <p className="text-xs text-gray-500">You can always sign in with an email link. A password is a faster alternative.</p>
      <input type="password" autoComplete="new-password" placeholder="New password (10+ characters)" value={pw} onChange={e => setPw(e.target.value)} className={input} />
      <input type="password" autoComplete="new-password" placeholder="Repeat password" value={pw2} onChange={e => setPw2(e.target.value)} className={input} />
      {msg && <p className={`text-xs ${msg.ok ? 'text-success' : 'text-red-400'}`}>{msg.text}</p>}
      <button type="submit" disabled={busy} className="bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
        {busy ? 'Saving...' : 'Save password'}
      </button>
    </form>
  )
}
