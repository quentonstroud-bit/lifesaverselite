import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Phone, Mail, ChevronRight, TrendingUp } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const STATUS_COLORS = {
  ACCEPTED: 'bg-success/20 text-success',
  PENDING:  'bg-warning/20 text-warning',
  DECLINED: 'bg-red-500/20 text-red-400',
  POOL:     'bg-indigo-500/20 text-indigo-300',
}

export default function LSHome() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Partner'

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=ls_data&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const totalEarned   = data?.totalEarned   ?? 0
  const starsBalance  = data?.starsBalance  ?? 0
  const totalSubmitted= data?.totalSubmitted ?? 0
  const weeklyLeads   = data?.weeklyLeadsCount ?? 0
  const multiplierTarget = 6
  const recent        = (data?.referrals || []).slice(0, 3)
  const agent         = data?.agent || null

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Greeting */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-gray-400 text-sm">Good morning,</p>
          <h1 className="text-2xl font-bold">{firstName}</h1>
        </div>
        <div className="bg-warning/20 border border-warning/30 px-3 py-1.5 rounded-full">
          <span className="text-warning text-xs font-bold">{user?.tier || 'Star 1'}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Earned',   value: loading ? '…' : `$${totalEarned.toFixed(2)}` },
          { label: 'STARS Balance',  value: loading ? '…' : starsBalance },
          { label: 'Referrals',      value: loading ? '…' : totalSubmitted },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Assigned Agent */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Your Assigned Agent</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : agent ? (
          <>
            <p className="font-semibold mb-1">{agent.name}</p>
            <p className="text-gray-400 text-sm mb-4">{agent.agency}</p>
            <div className="flex gap-3">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="flex items-center gap-2 bg-bg border border-gray-700 px-4 py-2.5 rounded-lg text-sm hover:border-gray-500 transition-colors">
                  <Phone size={14} className="text-primary" /> Call
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="flex items-center gap-2 bg-bg border border-gray-700 px-4 py-2.5 rounded-lg text-sm hover:border-gray-500 transition-colors">
                  <Mail size={14} className="text-primary" /> Email
                </a>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No agent assigned yet.</p>
        )}
      </div>

      {/* Weekly multiplier */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Weekly Multiplier Progress</p>
          <TrendingUp size={16} className="text-warning" />
        </div>
        <p className="text-gray-400 text-xs mb-3">
          {weeklyLeads >= multiplierTarget
            ? '3x multiplier active this week!'
            : `Submit ${multiplierTarget - weeklyLeads} more lead${multiplierTarget - weeklyLeads !== 1 ? 's' : ''} this week to activate the 3x multiplier bonus.`}
        </p>
        <div className="h-2 bg-bg rounded-full overflow-hidden mb-2">
          <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${Math.min(100, (weeklyLeads / multiplierTarget) * 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{weeklyLeads} submitted</span>
          <span>{multiplierTarget} needed</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { label: 'Wk 1', value: '3x' },
            { label: 'Wk 2', value: '2x' },
            { label: 'Wk 3', value: '1.5x' },
            { label: 'Wk 4+', value: 'Reset' },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-bg border border-gray-700 rounded-lg p-2 text-center">
              <p className="text-xs font-bold text-warning">{value}</p>
              <p className="text-xs text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick submit CTA */}
      <button className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
        Submit a Referral <ChevronRight size={18} />
      </button>

      {/* Recent referrals */}
      <div>
        <p className="text-sm font-bold mb-3">Recent Referrals</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-gray-500 text-sm">No referrals submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map(r => (
              <div key={r.id} className="bg-surface border border-gray-800 rounded-xl px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.date}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-700 text-gray-400'}`}>
                    {r.status}
                  </span>
                  {r.stars > 0 && <StarRating rating={r.stars} size={12} />}
                  {r.earned != null
                    ? <span className="text-success text-xs font-semibold">${r.earned.toFixed(2)}</span>
                    : <span className="text-gray-500 text-xs">--</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
