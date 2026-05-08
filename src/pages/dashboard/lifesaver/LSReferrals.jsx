import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import StarRating from '../../../components/StarRating'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const STATUS_COLORS = {
  ACCEPTED: 'bg-success/20 text-success border-success/20',
  PENDING:  'bg-warning/20 text-warning border-warning/20',
  DECLINED: 'bg-red-500/20 text-red-400 border-red-500/20',
  POOL:     'bg-indigo-500/20 text-indigo-300 border-indigo-500/20',
}

const FILTERS = ['All', 'Accepted', 'Pending', 'Declined']

export default function LSReferrals() {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('All')

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=ls_data&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setReferrals(d.referrals || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const filtered = filter === 'All'
    ? referrals
    : referrals.filter(r => r.status === filter.toUpperCase())

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">My Referrals</h1>
        <p className="text-gray-400 text-sm mt-1">{loading ? '…' : `${referrals.length} total submission${referrals.length !== 1 ? 's' : ''}`}</p>
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
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          {referrals.length === 0 ? 'No referrals submitted yet.' : `No ${filter.toLowerCase()} referrals.`}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-surface border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-gray-500 text-xs">{r.policy}</p>
                <p className="text-gray-600 text-xs mt-1">{r.date}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || 'bg-gray-700 text-gray-400 border-gray-700'}`}>
                  {r.status}
                </span>
                {r.stars > 0
                  ? <StarRating rating={r.stars} size={13} />
                  : <span className="text-gray-600 text-xs">Not rated yet</span>}
                {r.earned != null
                  ? <span className="text-success text-sm font-bold">${r.earned.toFixed(2)}</span>
                  : <span className="text-gray-500 text-sm">--</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
