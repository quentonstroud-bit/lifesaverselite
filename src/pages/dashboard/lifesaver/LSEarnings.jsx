import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Trophy, Zap } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const MILESTONES = [
  { stars: 25,  bonus: 5 },
  { stars: 50,  bonus: 10 },
  { stars: 100, bonus: 25 },
  { stars: 250, bonus: 75 },
  { stars: 500, bonus: 200 },
]

export default function LSEarnings() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=ls_data&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const totalEarned  = data?.totalEarned  ?? 0
  const weeklyEarned = data?.weeklyEarned ?? 0
  const starsBalance = data?.starsBalance ?? 0
  const weekly       = data?.weeklyBreakdown || []

  const nextMilestone = MILESTONES.find(m => m.stars > starsBalance) || MILESTONES[MILESTONES.length - 1]

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Your performance summary</p>
      </div>

      {/* Total */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">All-Time Earnings</p>
        <p className="text-4xl font-extrabold text-white">{loading ? '…' : `$${totalEarned.toFixed(2)}`}</p>
        {!loading && weeklyEarned > 0 && (
          <p className="text-success text-sm mt-2">+${weeklyEarned.toFixed(2)} this week</p>
        )}
      </div>

      {/* STARS balance + milestones */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-warning" />
          <p className="font-bold">STARS Balance: {loading ? '…' : starsBalance}</p>
        </div>
        {!loading && starsBalance < nextMilestone.stars && (
          <p className="text-gray-400 text-xs mb-4">
            {nextMilestone.stars - starsBalance} more STARS to unlock ${nextMilestone.bonus} milestone bonus.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {MILESTONES.map(({ stars, bonus }) => {
            const reached = starsBalance >= stars
            const isNext  = stars === nextMilestone.stars && !reached
            return (
              <div key={stars} className={`flex items-center justify-between py-3 px-4 rounded-lg border ${reached ? 'border-success/30 bg-success/10' : isNext ? 'border-warning/30 bg-warning/10' : 'border-gray-800 bg-bg'}`}>
                <div className="flex items-center gap-3">
                  <Zap size={14} className={reached ? 'text-success' : isNext ? 'text-warning' : 'text-gray-600'} />
                  <span className="text-sm font-semibold">{stars} STARS</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${reached ? 'text-success' : 'text-gray-300'}`}>${bonus} bonus</span>
                  {reached && (
                    <button className="bg-success text-black text-xs font-bold px-3 py-1 rounded-full">Claim</button>
                  )}
                  {isNext && (
                    <span className="text-warning text-xs font-semibold">Next</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly breakdown */}
      <div>
        <p className="text-sm font-bold mb-3">Weekly Breakdown</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : weekly.length === 0 ? (
          <p className="text-gray-500 text-sm">No weekly data yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {weekly.map(w => (
              <div key={w.week} className="bg-surface border border-gray-800 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">{w.week}</p>
                  <span className="text-warning text-xs font-bold bg-warning/20 px-2 py-0.5 rounded-full">{w.multiplier} multiplier</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-gray-500">Leads</p>
                    <p className="font-bold mt-0.5">{w.leads}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Base</p>
                    <p className="font-bold mt-0.5">${w.base.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-bold text-success mt-0.5">${w.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
