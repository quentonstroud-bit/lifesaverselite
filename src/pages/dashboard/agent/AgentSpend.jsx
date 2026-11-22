import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { apiGet } from '../../../lib/api'

const money = (n) => `$${Number(n || 0).toFixed(2)}`

export default function AgentSpend() {
  const { user }   = useAuth()
  const [data,     setData]    = useState(null)
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) { setLoading(false); return }
    apiGet('agent_spend')
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const transactions = (data?.transactions || []).filter(t => t.charged > 0 || t.status === 'FREE')
  const periods = data?.periods || {}

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Spend</h1>
        <p className="text-gray-400 text-sm mt-1">What you've paid for leads. You pay per lead at checkout; there are no recurring charges.</p>
      </div>

      {/* Period totals */}
      <div className="grid grid-cols-3 gap-3">
        {[['thisWeek', 'This week'], ['thisMonth', 'This month'], ['ytd', 'This year']].map(([k, label]) => {
          const p = periods[k] || {}
          return (
            <div key={k} className="bg-surface border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-lg font-bold tabular-nums mt-0.5">{loading ? '...' : money(p.net)}</p>
              {!loading && (
                <p className="text-xs text-gray-500 mt-1">
                  {p.leads || 0} paid lead{p.leads === 1 ? '' : 's'}{p.freeLeads ? `, ${p.freeLeads} free` : ''}
                  {p.refunded > 0 && <><br />{money(p.refunded)} refunded</>}
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-600 -mt-2">Each paid lead is the lead price plus the $5.00 LifeSavers Elite service fee. Totals are after refunds. Weeks run Sunday to Saturday.</p>

      {/* Purchases this week */}
      <div>
        <p className="text-sm font-bold mb-3">Purchases in the last 7 days</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No purchases in the last 7 days.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((tx, i) => (
              <div key={i} className="bg-surface border border-gray-800 rounded-xl px-5 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{tx.leadName}</p>
                  <p className="text-xs text-gray-500">{tx.lifesaverHandle} · {tx.date}</p>
                  {tx.refunded > 0 && <p className="text-xs text-warning mt-1">{money(tx.refunded)} refunded</p>}
                </div>
                <p className="font-bold tabular-nums">{tx.charged > 0 ? money(tx.charged) : 'Free'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
