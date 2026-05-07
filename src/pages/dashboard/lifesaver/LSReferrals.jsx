import React, { useState } from 'react'
import StarRating from '../../../components/StarRating'

const ALL_REFERRALS = [
  { id: 1, name: 'Michael Torres', policy: 'Life Insurance', status: 'ACCEPTED', stars: 4, earned: 18.00, date: 'May 5, 2026' },
  { id: 2, name: 'Sandra Williams', policy: 'Health Insurance', status: 'PENDING', stars: 0, earned: null, date: 'May 6, 2026' },
  { id: 3, name: 'Derek Harris', policy: 'Final Expense', status: 'DECLINED', stars: 2, earned: 0, date: 'May 4, 2026' },
  { id: 4, name: 'Amy Chen', policy: 'Medicare', status: 'ACCEPTED', stars: 5, earned: 22.50, date: 'May 2, 2026' },
  { id: 5, name: 'James Monroe', policy: 'Life Insurance', status: 'PENDING', stars: 0, earned: null, date: 'May 7, 2026' },
  { id: 6, name: 'Tina Brooks', policy: 'Annuity', status: 'ACCEPTED', stars: 3, earned: 14.00, date: 'Apr 30, 2026' },
]

const STATUS_COLORS = {
  ACCEPTED: 'bg-success/20 text-success border-success/20',
  PENDING: 'bg-warning/20 text-warning border-warning/20',
  DECLINED: 'bg-red-500/20 text-red-400 border-red-500/20',
}

const FILTERS = ['All', 'Accepted', 'Pending', 'Declined']

export default function LSReferrals() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? ALL_REFERRALS
    : ALL_REFERRALS.filter(r => r.status === filter.toUpperCase())

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">My Referrals</h1>
        <p className="text-gray-400 text-sm mt-1">{ALL_REFERRALS.length} total submissions</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface border border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map(({ id, name, policy, status, stars, earned, date }) => (
          <div key={id} className="bg-surface border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-gray-500 text-xs">{policy}</p>
              <p className="text-gray-600 text-xs mt-1">{date}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>{status}</span>
              {stars > 0 ? <StarRating rating={stars} size={13} /> : <span className="text-gray-600 text-xs">Not rated yet</span>}
              {earned !== null
                ? <span className="text-success text-sm font-bold">${earned.toFixed(2)}</span>
                : <span className="text-gray-500 text-sm">--</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-10">No {filter.toLowerCase()} referrals yet.</p>
        )}
      </div>
    </div>
  )
}
