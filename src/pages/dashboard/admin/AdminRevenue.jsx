import React, { useState, useEffect } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export default function AdminRevenue() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=admin_revenue`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allTime     = data?.allTime     ?? 0
  const thisWeek    = data?.thisWeek    ?? 0
  const pace        = data?.monthlyPace ?? 0
  const byAgent     = data?.byAgent     || []
  const monthly     = data?.monthly     || []
  const lastSettled = data?.lastSettled ?? null
  const nextSettled = data?.nextSettled ?? null

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">$2.00 per accepted lead</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">All-Time</p>
          <p className="text-2xl font-extrabold">{loading ? '…' : `$${allTime.toFixed(2)}`}</p>
        </div>
        <div className="bg-success/10 border border-success/30 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">This Week</p>
          <p className="text-2xl font-extrabold text-success">{loading ? '…' : `$${thisWeek.toFixed(2)}`}</p>
        </div>
      </div>

      {/* Projected */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-warning" />
          <p className="text-sm font-bold">Projected This Month</p>
        </div>
        <p className="text-warning font-bold">{loading ? '…' : `$${pace.toFixed(2)}`}</p>
      </div>

      {/* By Agent */}
      <div>
        <p className="text-sm font-bold mb-3">Revenue by Agent / Broker</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : byAgent.length === 0 ? (
          <p className="text-gray-500 text-sm">No revenue data yet.</p>
        ) : (
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
            {byAgent.map(({ agency, accepted, fees }, i) => (
              <div key={agency} className={`flex items-center justify-between px-5 py-4 ${i < byAgent.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <div>
                  <p className="text-sm font-semibold">{agency}</p>
                  <p className="text-xs text-gray-500">{accepted} lead{accepted !== 1 ? 's' : ''} accepted</p>
                </div>
                <p className="font-bold text-success">${fees.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe settlements */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-gray-500" />
          <p className="text-sm font-bold">Stripe Settlements</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {lastSettled ? (
            <div className="flex justify-between">
              <span className="text-gray-400">Last settlement</span>
              <span className="text-success font-semibold">${lastSettled.amount.toFixed(2)} · {lastSettled.date}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-400">Last settlement</span>
              <span className="text-gray-500">None yet</span>
            </div>
          )}
          {nextSettled && (
            <div className="flex justify-between">
              <span className="text-gray-400">Next settlement</span>
              <span className="font-semibold">{nextSettled}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Pending amount</span>
            <span className="text-warning font-semibold">${thisWeek.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Monthly */}
      <div>
        <p className="text-sm font-bold mb-3">Monthly Breakdown</p>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : monthly.length === 0 ? (
          <p className="text-gray-500 text-sm">No monthly data yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {monthly.map(({ month, revenue, leads }) => (
              <div key={month} className="bg-surface border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{month}</p>
                  <p className="text-xs text-gray-500">{leads} lead{leads !== 1 ? 's' : ''} accepted</p>
                </div>
                <p className="font-bold text-success">${revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
