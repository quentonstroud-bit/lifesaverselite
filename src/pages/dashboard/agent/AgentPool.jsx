import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Clock, CheckCircle } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const FILTERS = ['All', 'Life Insurance', 'Health Insurance', 'Final Expense', 'Annuity', 'Medicare', '5-Star Only']

const PAYOUT_BY_STARS = { 1: 6, 2: 9, 3: 12, 4: 18, 5: 22.50 }

export default function AgentPool() {
  const { user }   = useAuth()
  const [pool,     setPool]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')
  const [claiming, setClaiming] = useState(null)
  const [claimed,  setClaimed]  = useState([])

  useEffect(() => {
    if (!WEBAPP_URL) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=pool_leads`)
      .then(r => r.json())
      .then(d => { setPool(d.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = pool.filter(l => {
    if (claimed.includes(l.id)) return false
    if (filter === 'All') return true
    if (filter === '5-Star Only') return l.stars === 5
    return l.policy?.toLowerCase().includes(filter.toLowerCase())
  })

  async function handleClaim(lead) {
    const payout = PAYOUT_BY_STARS[lead.stars] || 12
    setClaimed(p => [...p, lead.id])
    setClaiming(null)
    if (WEBAPP_URL) {
      try {
        await fetch(WEBAPP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: 'claim_from_pool',
            leadId: lead.id,
            agentId: user?.email,
            lifesaverPayout: payout,
          })
        })
      } catch {}
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">General Pool</h1>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
          <span>{loading ? '…' : `${filtered.length} available`}</span>
          {!loading && <span className="text-warning">{filtered.filter(l => l.hoursLeft < 6).length} expiring soon</span>}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-surface border border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lead cards */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CheckCircle size={36} className="mx-auto mb-3 text-gray-700" />
          <p className="font-semibold">Pool is empty right now</p>
          <p className="text-xs mt-1">Leads appear here when declined or expired by assigned agents.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(lead => {
            const urgent = lead.hoursLeft < 6
            const hot    = lead.hoursLeft < 24
            return (
              <div key={lead.id} className={`bg-surface border rounded-2xl overflow-hidden ${urgent ? 'border-red-500/60' : hot ? 'border-warning/40' : 'border-gray-800'}`}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${urgent ? 'bg-red-500/20 border-red-500/30 text-red-400' : hot ? 'bg-warning/20 border-warning/30 text-warning' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'}`}>
                      {lead.source || 'Available in pool'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} />
                      <span className={urgent ? 'text-red-400 font-bold' : hot ? 'text-warning font-semibold' : ''}>{lead.hoursLeft}hr left</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">{lead.firstName} {lead.lastInitial}.</p>
                      <p className="text-gray-400 text-sm">{lead.city}, {lead.state}</p>
                    </div>
                    <StarRating rating={lead.stars} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    {[
                      { label: 'Age',     value: lead.age },
                      { label: 'Health',  value: `${lead.health}/10` },
                      { label: 'Smoking', value: lead.smoking },
                      { label: 'Beneficiaries', value: lead.beneficiaries },
                      { label: 'Policy',  value: lead.policy },
                      { label: 'Timeline', value: lead.timeline },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg rounded-lg px-2 py-2">
                        <p className="text-gray-600">{label}</p>
                        <p className="font-semibold mt-0.5 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mb-4">From {lead.lifesaverHandle}</p>

                  <button onClick={() => setClaiming(lead)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Claim This Lead
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Claim modal */}
      {claiming && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-gray-700 rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Claim</h2>
            <p className="text-gray-400 text-sm mb-5">
              You are claiming {claiming.firstName} {claiming.lastInitial}. from the General Pool.
            </p>
            <div className="bg-bg rounded-xl p-4 flex flex-col gap-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Policy</span>
                <span className="font-semibold">{claiming.policy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Star rating</span>
                <StarRating rating={claiming.stars} size={14} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LifeSaver payout</span>
                <span className="font-semibold text-warning">-${(PAYOUT_BY_STARS[claiming.stars] || 12).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LSE fee</span>
                <span className="font-semibold text-primary">-$2.00</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setClaiming(null)} className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-xl text-sm hover:border-gray-500 transition-colors">Cancel</button>
              <button onClick={() => handleClaim(claiming)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
