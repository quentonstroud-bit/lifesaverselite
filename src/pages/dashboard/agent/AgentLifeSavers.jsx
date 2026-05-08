import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { DollarSign } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export default function AgentLifeSavers() {
  const { user }     = useAuth()
  const [lifesavers, setLifesavers] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=agent_lifesavers&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setLifesavers(d.lifesavers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const totalPayout = lifesavers.reduce((acc, ls) => acc + (ls.payout || 0), 0)

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">My LifeSavers</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? '…' : `${lifesavers.length} assigned partner${lifesavers.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Total payout */}
      {!loading && lifesavers.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Payout Due Sunday</p>
            <p className="text-2xl font-extrabold mt-1">${totalPayout.toFixed(2)}</p>
          </div>
          <DollarSign size={28} className="text-warning" />
        </div>
      )}

      {/* LifeSaver list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : lifesavers.length === 0 ? (
        <p className="text-gray-500 text-sm">No LifeSavers assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {lifesavers.map(ls => {
            const rate = ls.submitted > 0 ? Math.round((ls.accepted / ls.submitted) * 100) : 0
            return (
              <div key={ls.id} className="bg-surface border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{ls.name?.[0] || '?'}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{ls.name}</p>
                      <p className="text-gray-500 text-xs">{ls.handle || ls.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 70 ? 'bg-success/20 text-success' : rate >= 50 ? 'bg-warning/20 text-warning' : 'bg-red-500/20 text-red-400'}`}>
                    {rate}% accepted
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-bg rounded-lg py-2">
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-bold mt-0.5">{ls.submitted}</p>
                  </div>
                  <div className="bg-bg rounded-lg py-2">
                    <p className="text-gray-500">Accepted</p>
                    <p className="font-bold mt-0.5">{ls.accepted}</p>
                  </div>
                  <div className="bg-bg rounded-lg py-2">
                    <p className="text-gray-500">Payout Owed</p>
                    <p className="font-bold text-success mt-0.5">${(ls.payout || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
