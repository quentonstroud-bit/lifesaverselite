import React, { useState, useEffect } from 'react'
import AdminFinance from './AdminFinance'
import AdminPayouts from './AdminPayouts'
import { apiGet } from '../../../lib/api'

export default function AdminRevenue() {
  const [byAgent, setByAgent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet('admin_revenue')
      .then(d => { setByAgent(d.byAgent || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Revenue & Finance</h1>
        <p className="text-gray-400 text-sm mt-1">Income, fees, payroll and 1099s, calculated from every purchase, refund and payout.</p>
      </div>

      <AdminFinance />

      {/* Weekly LifeSaver payroll */}
      <AdminPayouts />

      {/* By agent */}
      <div>
        <p className="text-sm font-bold mb-3">LSE service fees by Agent / Broker</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : byAgent.length === 0 ? (
          <p className="text-gray-500 text-sm">No purchases yet.</p>
        ) : (
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            {byAgent.map(({ agency, accepted, fees }, i) => (
              <div key={agency} className={`flex items-center justify-between px-5 py-4 ${i < byAgent.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <div>
                  <p className="text-sm font-semibold">{agency}</p>
                  <p className="text-xs text-gray-500">{accepted} paid lead{accepted !== 1 ? 's' : ''}</p>
                </div>
                <p className="font-bold text-success tabular-nums">${fees.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
