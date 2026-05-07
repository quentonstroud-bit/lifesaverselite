import React, { useState } from 'react'
import { X } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const ALL_LEADS = [
  { id: 1, name: 'Sandra W.', policy: 'Life Insurance', lifesaver: '@jordansmith', agent: 'Rivera Insurance', status: 'PENDING', stars: 0 },
  { id: 2, name: 'Michael T.', policy: 'Life Insurance', lifesaver: '@jordansmith', agent: 'Rivera Insurance', status: 'ACCEPTED', stars: 4 },
  { id: 3, name: 'Derek H.', policy: 'Final Expense', lifesaver: '@priya_connects', agent: 'Rivera Insurance', status: 'DECLINED', stars: 2 },
  { id: 4, name: 'Amy C.', policy: 'Medicare', lifesaver: '@danielleking', agent: 'Rivera Insurance', status: 'ACCEPTED', stars: 5 },
  { id: 5, name: 'Raymond K.', policy: 'Life Insurance', lifesaver: '@priya_connects', agent: '--', status: 'POOL', stars: 4 },
  { id: 6, name: 'Chris P.', policy: 'Medicare', lifesaver: '@danielleking', agent: '--', status: 'POOL', stars: 5 },
]

const STATUS_COLORS = {
  PENDING: 'bg-warning/20 text-warning',
  ACCEPTED: 'bg-success/20 text-success',
  DECLINED: 'bg-red-500/20 text-red-400',
  POOL: 'bg-indigo-500/20 text-indigo-300',
}

const FILTERS = ['All', 'Pending', 'Accepted', 'Declined', 'In Pool']

const SCORE_DIMS = [
  { key: 'health', label: 'Health Rating', options: ['9 to 10 (Excellent)', '7 to 8 (Good)', '5 to 6 (Average)', '3 to 4 (Below avg)', '1 to 2 (Poor)'] },
  { key: 'beneficiaries', label: 'Beneficiaries Listed', options: ['3 or more', '2', '1', 'None'] },
  { key: 'smoking', label: 'Smoking Status', options: ['Non-Smoker', 'Former Smoker', 'Current Smoker'] },
  { key: 'timeline', label: 'Purchase Timeline', options: ['1 to 3 months', '3 to 6 months', '6 to 12 months', 'Just exploring'] },
  { key: 'policy', label: 'Policy Selected', options: ['Specific product named', 'General category', 'Unsure'] },
  { key: 'engagement', label: 'Engagement Level', options: ['Ready for a call', 'Interested', 'Passive', 'Unresponsive'] },
]

const WEIGHTS = { health: 25, beneficiaries: 25, smoking: 20, timeline: 10, policy: 10, engagement: 10 }
const SCORES = {
  health: [100, 80, 55, 25, 0],
  beneficiaries: [100, 75, 40, 0],
  smoking: [100, 50, 0],
  timeline: [100, 65, 35, 10],
  policy: [100, 50, 0],
  engagement: [100, 60, 20, 0],
}

function calculateStars(selections) {
  let total = 0
  Object.entries(selections).forEach(([key, idx]) => {
    if (idx !== null) total += (SCORES[key][idx] * WEIGHTS[key]) / 100
  })
  if (total >= 85) return 5
  if (total >= 70) return 4
  if (total >= 50) return 3
  if (total >= 30) return 2
  return 1
}

export default function AdminLeads() {
  const [filter, setFilter] = useState('All')
  const [ratingModal, setRatingModal] = useState(null)
  const [selections, setSelections] = useState({})
  const [override, setOverride] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  const filtered = ALL_LEADS.filter(l => {
    if (filter === 'All') return true
    if (filter === 'In Pool') return l.status === 'POOL'
    return l.status === filter.toUpperCase()
  })

  const computedStars = Object.keys(selections).length === SCORE_DIMS.length
    ? calculateStars(Object.fromEntries(Object.entries(selections).map(([k, v]) => [k, v])))
    : null

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">All Leads</h1>
        <p className="text-gray-400 text-sm mt-1">{ALL_LEADS.length} total</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface border border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lead table */}
      <div className="flex flex-col gap-3">
        {filtered.map(lead => (
          <div key={lead.id} className="bg-surface border border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{lead.name}</p>
                <p className="text-gray-500 text-xs">{lead.policy}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>{lead.status}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{lead.lifesaver} to {lead.agent}</span>
              {lead.stars > 0 ? <StarRating rating={lead.stars} size={13} /> : (
                lead.status === 'PENDING' && (
                  <button onClick={() => { setRatingModal(lead); setSelections({}) }} className="text-primary font-semibold">
                    Rate Lead
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* STARS rating modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-surface border-t border-gray-700 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Rate: {ratingModal.name}</h2>
              <button onClick={() => setRatingModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              {SCORE_DIMS.map(({ key, label, options }) => (
                <div key={key}>
                  <p className="text-sm font-semibold mb-2">{label} <span className="text-gray-500 text-xs">({WEIGHTS[key]}%)</span></p>
                  <div className="flex flex-col gap-1.5">
                    {options.map((opt, idx) => (
                      <label key={opt} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer text-xs transition-colors ${selections[key] === idx ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                        <input type="radio" name={key} checked={selections[key] === idx} onChange={() => setSelections(p => ({ ...p, [key]: idx }))} className="accent-red-600" />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {computedStars !== null && (
              <div className="bg-bg border border-gray-700 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Calculated Rating</p>
                <StarRating rating={computedStars} size={20} />
                <p className="text-sm font-bold mt-2">{computedStars} Star{computedStars !== 1 ? 's' : ''}</p>
              </div>
            )}

            {/* Override */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">Manual Override (optional)</p>
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setOverride(String(n))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${override === String(n) ? 'bg-warning border-warning text-black' : 'bg-bg border-gray-700 text-gray-400'}`}>
                    {n}
                  </button>
                ))}
              </div>
              {override && (
                <input placeholder="Reason for override (required)" value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                  className="w-full bg-bg border border-gray-700 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary" />
              )}
            </div>

            <button onClick={() => setRatingModal(null)} disabled={!computedStars && !override}
              className="w-full bg-primary hover:bg-red-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-colors">
              Save Rating
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
