import React, { useState } from 'react'
import { Star, Trophy, Info, X } from 'lucide-react'
import StarRating from '../../../components/StarRating'
import { useAuth } from '../../../context/AuthContext'

const BADGES = [
  { name: 'First Referral', desc: 'Submit your first lead', earned: true, icon: '🎯' },
  { name: 'Hot Streak', desc: '5 accepted leads in a week', earned: true, icon: '🔥' },
  { name: 'Five-Star Supplier', desc: 'Submit a 5-star lead', earned: false, icon: '⭐' },
  { name: 'Top 10%', desc: 'Reach top 10% of network', earned: false, icon: '🏆' },
  { name: 'Century Club', desc: 'Submit 100 total leads', earned: false, icon: '💯' },
  { name: 'Elite Partner', desc: 'Reach Star 5 Elite tier', earned: false, icon: '💎' },
]

const LEADERBOARD = [
  { rank: 1, handle: '@danielleking', stars: 312, you: false },
  { rank: 2, handle: '@marcus_r', stars: 287, you: false },
  { rank: 3, handle: '@priya_connects', stars: 256, you: false },
  { rank: 4, handle: '@jordansmith', stars: 47, you: true },
  { rank: 5, handle: '@tylerb', stars: 44, you: false },
  { rank: 6, handle: '@mia_w', stars: 38, you: false },
]

const TIPS = [
  { tip: 'Ask about health', detail: 'A higher health rating (7 or above) significantly boosts the lead score.' },
  { tip: 'Get beneficiaries', detail: 'Leads with 2 or more beneficiaries listed score much higher.' },
  { tip: 'Ask about smoking', detail: 'Non-smokers score the highest in this category.' },
  { tip: 'Find a timeline', detail: 'Leads ready to act within 3 months earn the top score.' },
  { tip: 'Know what they want', detail: 'A specific policy type (not "unsure") raises the score.' },
  { tip: 'Note engagement level', detail: 'Is the lead ready to take a call? Engaged leads score highest.' },
]

export default function LSStars() {
  const { user } = useAuth()
  const [showTips, setShowTips] = useState(false)
  const myRank = LEADERBOARD.find(l => l.you)?.rank || '--'

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">STARS</h1>
          <p className="text-gray-400 text-sm mt-0.5">Your achievements and network rank</p>
        </div>
        <button onClick={() => setShowTips(true)} className="flex items-center gap-1.5 bg-surface border border-gray-700 text-gray-300 text-xs font-semibold px-3 py-2 rounded-lg hover:border-gray-500 transition-colors">
          <Info size={13} /> Tips for Higher Rating
        </button>
      </div>

      {/* Badge grid */}
      <div>
        <p className="text-sm font-bold mb-3">Achievement Badges</p>
        <div className="grid grid-cols-2 gap-3">
          {BADGES.map(({ name, desc, earned, icon }) => (
            <div key={name} className={`bg-surface border rounded-xl p-4 flex flex-col gap-2 ${earned ? 'border-warning/40' : 'border-gray-800 opacity-50'}`}>
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-bold">{name}</p>
              <p className="text-xs text-gray-500">{desc}</p>
              {earned && <span className="text-warning text-xs font-semibold">Earned</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Next badge progress */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-sm font-bold mb-2">Next: Five-Star Supplier</p>
        <p className="text-gray-400 text-xs mb-3">Submit a lead that earns 5 stars to unlock this badge.</p>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div className="h-full bg-warning rounded-full" style={{ width: '40%' }} />
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <p className="text-sm font-bold mb-3">Network Leaderboard</p>
        <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
          {LEADERBOARD.map(({ rank, handle, stars, you }) => (
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
        <p className="text-center text-gray-500 text-xs mt-2">Your rank: #{myRank} in the network</p>
      </div>

      {/* Tips modal */}
      {showTips && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-surface border-t border-gray-700 rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Tips for a Higher Rating</h2>
              <button onClick={() => setShowTips(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
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
