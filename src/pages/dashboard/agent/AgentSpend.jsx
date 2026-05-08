import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export default function AgentSpend() {
  const { user }   = useAuth()
  const [data,     setData]    = useState(null)
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL || !user?.email) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=agent_spend&email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user?.email])

  const transactions   = data?.transactions   || []
  const totalLSEFees   = data?.totalLSEFees   ?? 0
  const totalPayouts   = data?.totalPayouts   ?? 0
  const totalOwed      = totalLSEFees + totalPayouts
  const acceptedCount  = data?.acceptedCount  ?? 0

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Spend</h1>
        <p className="text-gray-400 text-sm mt-1">This week</p>
      </div>

      {/* Total card */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-1">Total Owed This Week</p>
        <p className="text-4xl font-extrabold">{loading ? '…' : `$${totalOwed.toFixed(2)}`}</p>
        <p className="text-gray-500 text-xs mt-2">Charged every Sunday via Stripe</p>
      </div>

      {/* Breakdown */}
      {!loading && (
        <div className="bg-surface border border-gray-800 rounded-xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Breakdown</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'LSE Service Fees',   value: `$${totalLSEFees.toFixed(2)}`,  note: `${acceptedCount} accepted lead${acceptedCount !== 1 ? 's' : ''} × $2.00` },
              { label: 'LifeSaver Payouts',  value: `$${totalPayouts.toFixed(2)}`,  note: 'Distributed to your LifeSavers' },
              { label: 'Leads Accepted',     value: String(acceptedCount) },
              { label: 'Avg per Lead',       value: acceptedCount > 0 ? `$${(totalOwed / acceptedCount).toFixed(2)}` : '--' },
            ].map(({ label, value, note }) => (
              <div key={label} className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-300">{label}</p>
                  {note && <p className="text-xs text-gray-600">{note}</p>}
                </div>
                <p className="font-bold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction log */}
      <div>
        <p className="text-sm font-bold mb-3">Transaction Log</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.map((tx, i) => (
              <div key={i} className="bg-surface border border-gray-800 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold">{tx.leadName}</p>
                    <p className="text-xs text-gray-500">{tx.lifesaverHandle} · {tx.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === 'ACCEPTED' || tx.status === 'POOL_CLAIM' ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-400'}`}>
                    {tx.status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  <span>LSE fee: <strong className="text-white">-${tx.lseFee.toFixed(2)}</strong></span>
                  <span>Payout: <strong className="text-white">-${tx.lifesaverPayout.toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
