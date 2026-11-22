import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Wallet, Award } from 'lucide-react'
import { apiGet } from '../../../lib/api'
import { LEVELS } from '../../../components/LevelsReveal'

const money = (n) => `$${Number(n || 0).toFixed(2)}`

export default function LSEarnings() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) { setLoading(false); return }
    apiGet('ls_data')
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const t = data?.totals || { week: 0, month: 0, ytd: 0, paidThisYear: 0, owedNow: 0, weekly: [] }
  const level = data?.isSupreme ? 'Supreme' : (data?.level || 'Supporter')
  const next = data?.nextLevel
  const nextInfo = next ? LEVELS.find(l => l.name === next.name) : null
  const qualified = data?.qualifiedLeads ?? 0
  const pct = next ? Math.min(100, Math.round((qualified / next.at) * 100)) : 100
  const weekly = (t.weekly || []).slice().reverse()
  const v = (n) => (loading ? '...' : money(n))

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Commissions and bonuses, paid every Sunday</p>
      </div>

      {/* Next payout */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-1"><Wallet size={15} /> Your next payout</div>
        <p className="text-4xl font-extrabold tabular-nums">{v(t.owedNow)}</p>
        <p className="text-gray-500 text-xs mt-2">Paid to you so far this year: <span className="text-white font-semibold">{v(t.paidThisYear)}</span></p>
      </div>

      {/* Earned by period */}
      <div className="grid grid-cols-3 gap-3">
        {[['This week', t.week], ['This month', t.month], ['This year', t.ytd]].map(([label, n]) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-lg font-bold tabular-nums">{v(n)}</p>
            <p className="text-gray-500 text-xs mt-0.5">Earned {label.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Award size={18} className="text-warning" />
          <p className="font-bold">Level: {loading ? '...' : level}</p>
        </div>
        {loading ? null : next ? (
          <>
            <p className="text-gray-400 text-xs mb-3">
              {next.remaining} more qualifying lead{next.remaining !== 1 ? 's' : ''} (2 stars or higher) to reach {next.name}
              {nextInfo?.bonus ? ` and a $${nextInfo.bonus} bonus` : ''}.
            </p>
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-2 tabular-nums">{qualified} of {next.at} qualifying leads</p>
          </>
        ) : (
          <p className="text-gray-400 text-xs">You have reached the top level. Stay the month's top LifeSaver to hold the Supreme title.</p>
        )}
      </div>

      {/* Weekly breakdown */}
      <div>
        <p className="text-sm font-bold mb-3">Last 8 weeks</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : weekly.every(w => w.total === 0) ? (
          <p className="text-gray-500 text-sm">No earnings yet. You earn when an agent buys one of your referrals.</p>
        ) : (
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            {weekly.map((w, i) => (
              <div key={w.week} className={`flex items-center justify-between px-5 py-3 ${i < weekly.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <div>
                  <p className="text-sm font-semibold">{w.week}</p>
                  <p className="text-xs text-gray-500">
                    {w.leads} lead{w.leads !== 1 ? 's' : ''} sold{w.bonuses > 0 ? `, ${money(w.bonuses)} bonus` : ''}
                  </p>
                </div>
                <p className={`font-bold tabular-nums ${w.total > 0 ? 'text-success' : 'text-gray-600'}`}>{money(w.total)}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 mt-3">Commissions are the lead price minus payment processing fees. Weeks run Sunday to Saturday.</p>
      </div>
    </div>
  )
}
