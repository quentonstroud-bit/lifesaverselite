import React, { useState, useEffect } from 'react'
import { Star, Info, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const BADGE_DEFS = [
  { key: 'first_referral',    name: 'First Referral',      desc: 'Submit your first lead',          icon: '🎯' },
  { key: 'hot_streak',        name: 'Hot Streak',          desc: '5 accepted leads in a week',      icon: '🔥' },
  { key: 'five_star',         name: 'Five-Star Supplier',  desc: 'Submit a 5-star lead',            icon: '⭐' },
  { key: 'top_ten',           name: 'Top 10%',             desc: 'Reach top 10% of network',        icon: '🏆' },
  { key: 'century_club',      name: 'Century Club',        desc: 'Submit 100 total leads',          icon: '💯' },
  { key: 'elite_partner',     name: 'Elite Partner',       desc: 'Reach Star 5 Elite tier',         icon: '💎' },
]

const TIPS = [
  { tip: 'Ask about health',     detail: 'A higher health rating (7 or above) significantly boosts the lead score.' },
  { tip: 'Get beneficiaries',   detail: 'Leads with 2 or more beneficiaries listed score much higher.' },
  { tip: 'Ask about smoking',   detail: 'Non-smokers score the highest in this category.' },
  { tip: 'Find a timeline',     detail: 'Leads ready to act within 3 months earn the top score.' },
  { tip: 'Know what they want', detail: 'A specific policy type (not "unsure") raises the score.' },
  { tip: 'Note engagement',     detail: 'Is the lead ready to take a call? Engaged leads score highest.' },
]

export default function LSStars() {
  const { user }    = useAuth()
  const [data,      setData]     = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [showTips,  setShowTips] = useState(false)

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=ls_data&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const starsBalance   = data?.starsBalance  ?? 0
  const totalAccepted  = data?.totalAccepted ?? 0
  const totalSubmitted = data?.totalSubmitted ?? 0
  const leaderboard    = data?.leaderboard   ?? []
  const earnedBadges   = data?.badges        ?? {}

  const myRank = leaderboard.find(l => l.you)?.rank ?? null

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">STARS</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your achievements and network rank</p>
        </div>
        <button onClick={() => setShowTips(true)} className="flex items-center gap-1.5 bg-surface border border-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg hover:border-gray-500 transition-colors">
          <Info size={13} /> Tips
        </button>
      </div>

      {/* STARS balance tile */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current STARS Balance</p>
        <p className="text-5xl font-extrabold text-warning">{loading ? '…' : starsBalance}</p>
        {!loading && (
          <p className="text-gray-500 text-xs mt-2">{totalAccepted} of {totalSubmitted} referrals accepted</p>
        )}
      </div>

      {/* Achievement badges */}
      <div>
        <p className="text-sm font-bold mb-3">Achievement Badges</p>
        <div className="grid grid-cols-2 gap-3">
          {BADGE_DEFS.map(({ key, name, desc, icon }) => {
            const earned = !!earnedBadges[key]
            return (
              <div key={key} className={`bg-surface border rounded-xl p-4 flex flex-col gap-2 ${earned ? 'border-warning/40' : 'border-gray-800 opacity-50'}`}>
                <span className="text-2xl">{icon}</span>
                <p className="text-sm font-bold">{name}</p>
                <p className="text-xs text-gray-500">{desc}</p>
                {earned && <span className="text-warning text-xs font-semibold">Earned</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <p className="text-sm font-bold mb-3">Network Leaderboard</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-gray-500 text-sm">No leaderboard data yet.</p>
        ) : (
          <>
            <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
              {leaderboard.map(({ rank, handle, stars, you }) => (
                <div key={handle} className={`flex items-center justify-between px-5 py-3 border-b border-gray-800 last:border-0 ${you ? 'bg-primary/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 text-center ${rank <= 3 ? 'text-warning' : 'text-gray-500'}`}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                    </span>
                    <span className={`text-sm font-semibold ${you ? 'text-primary' : 'text-white'}`}>
                      {handle} {you && <span className="text-xs text-primary font-normal">(you)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-warning fill-warning" />
                    <span className="text-sm font-bold">{stars}</span>
                  </div>
                </div>
              ))}
            </div>
            {myRank && <p className="text-center text-gray-500 text-xs mt-2">Your rank: #{myRank} in the network</p>}
          </>
        )}
      </div>

      {/* Tips modal */}
      {showTips && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-surface border-t border-gray-700 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Tips for a Higher Rating</h2>
              <button onClick={() => setShowTips(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {TIPS.map(({ tip, detail }) => (
                <div key={tip} className="bg-bg border border-gray-800 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-1">{tip}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
