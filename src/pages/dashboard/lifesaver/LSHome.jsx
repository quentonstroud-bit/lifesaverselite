import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, ChevronRight, TrendingUp } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const RECENT_REFERRALS = [
  { name: 'Michael T.', status: 'ACCEPTED', stars: 4, earned: '$18.00', ago: '2 days ago' },
  { name: 'Sandra W.', status: 'PENDING', stars: 0, earned: '--', ago: '1 day ago' },
  { name: 'Derek H.', status: 'DECLINED', stars: 2, earned: '$0.00', ago: '3 days ago' },
]

const STATUS_COLORS = {
  ACCEPTED: 'bg-success/20 text-success',
  PENDING: 'bg-warning/20 text-warning',
  DECLINED: 'bg-red-500/20 text-red-400',
}

export default function LSHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] || 'Partner'
  const weeklLeadsCount = 3
  const multiplierLeadsNeeded = 6

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
          { label: 'Total Earned', value: '$142.00' },
          { label: 'STARS Balance', value: '47' },
          { label: 'Referrals', value: '12' },
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
        <p className="font-semibold mb-1">Marcus Rivera</p>
        <p className="text-gray-400 text-sm mb-4">Rivera Insurance Group</p>
        <div className="flex gap-3">
          <a href="tel:5550001234" className="flex items-center gap-2 bg-bg border border-gray-700 px-4 py-2.5 rounded-lg text-sm hover:border-gray-500 transition-colors">
            <Phone size={14} className="text-primary" /> Call
          </a>
          <a href="mailto:marcus@riverainsurance.com" className="flex items-center gap-2 bg-bg border border-gray-700 px-4 py-2.5 rounded-lg text-sm hover:border-gray-500 transition-colors">
            <Mail size={14} className="text-primary" /> Email
          </a>
        </div>
      </div>

      {/* Weekly multiplier */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Weekly Multiplier Progress</p>
          <TrendingUp size={16} className="text-warning" />
        </div>
        <p className="text-gray-400 text-xs mb-3">Submit {multiplierLeadsNeeded - weeklLeadsCount} more leads this week to activate the 3x multiplier bonus.</p>
        <div className="h-2 bg-bg rounded-full overflow-hidden mb-2">
          <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${(weeklLeadsCount / multiplierLeadsNeeded) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{weeklLeadsCount} submitted</span>
          <span>{multiplierLeadsNeeded} needed</span>
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
        <div className="flex flex-col gap-3">
          {RECENT_REFERRALS.map(({ name, status, stars, earned, ago }) => (
            <div key={name} className="bg-surface border border-gray-800 rounded-xl px-4 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-gray-500 text-xs">{ago}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>{status}</span>
                {stars > 0 && <StarRating rating={stars} size={12} />}
                <span className="text-success text-xs font-semibold">{earned}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
