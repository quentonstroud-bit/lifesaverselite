import React from 'react'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'

const BY_AGENT = [
  { agency: 'Summit Life Partners', accepted: 24, fees: 48.00 },
  { agency: 'Rivera Insurance Group', accepted: 8, fees: 16.00 },
  { agency: 'Greenway Financial', accepted: 3, fees: 6.00 },
]

const MONTHLY = [
  { month: 'May 2026', revenue: 142.00, leads: 71 },
  { month: 'Apr 2026', revenue: 386.00, leads: 193 },
  { month: 'Mar 2026', revenue: 320.00, leads: 160 },
]

export default function AdminRevenue() {
  const allTime = 1842.00
  const thisWeek = 142.00
  const pace = (thisWeek / 7) * 30

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">$2.00 per accepted lead</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">All-Time</p>
          <p className="text-2xl font-extrabold">${allTime.toFixed(2)}</p>
        </div>
        <div className="bg-success/10 border border-success/30 rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-1">This Week</p>
          <p className="text-2xl font-extrabold text-success">${thisWeek.toFixed(2)}</p>
        </div>
      </div>

      {/* Projected */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-warning" />
          <p className="text-sm font-bold">Projected This Month</p>
        </div>
        <p className="text-warning font-bold">${pace.toFixed(2)}</p>
      </div>

      {/* By Agent */}
      <div>
        <p className="text-sm font-bold mb-3">Revenue by Agent/Broker</p>
        <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
          {BY_AGENT.map(({ agency, accepted, fees }, i) => (
            <div key={agency} className={`flex items-center justify-between px-5 py-4 ${i < BY_AGENT.length - 1 ? 'border-b border-gray-800' : ''}`}>
              <div>
                <p className="text-sm font-semibold">{agency}</p>
                <p className="text-xs text-gray-500">{accepted} leads accepted</p>
              </div>
              <p className="font-bold text-success">${fees.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe settlement */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} className="text-gray-500" />
          <p className="text-sm font-bold">Stripe Settlements</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Last settlement</span>
            <span className="text-success font-semibold">$386.00 - May 4, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Next settlement</span>
            <span className="font-semibold">May 11, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pending amount</span>
            <span className="text-warning font-semibold">${thisWeek.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Monthly */}
      <div>
        <p className="text-sm font-bold mb-3">Monthly Breakdown</p>
        <div className="flex flex-col gap-3">
          {MONTHLY.map(({ month, revenue, leads }) => (
            <div key={month} className="bg-surface border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{month}</p>
                <p className="text-xs text-gray-500">{leads} leads accepted</p>
              </div>
              <p className="font-bold text-success">${revenue.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
