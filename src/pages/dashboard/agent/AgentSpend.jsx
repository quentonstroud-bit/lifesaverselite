import React from 'react'
import { DollarSign, TrendingUp } from 'lucide-react'

const TRANSACTIONS = [
  { id: 1, lead: 'Michael T.', lifesaver: '@jordansmith', lseFee: 2.00, lifesaverPayout: 18.00, status: 'ACCEPTED', date: 'May 5' },
  { id: 2, lead: 'Amy C.', lifesaver: '@danielleking', lseFee: 2.00, lifesaverPayout: 22.50, status: 'ACCEPTED', date: 'May 2' },
  { id: 3, lead: 'Tina B.', lifesaver: '@jordansmith', lseFee: 2.00, lifesaverPayout: 14.00, status: 'ACCEPTED', date: 'Apr 30' },
  { id: 4, lead: 'Derek H.', lifesaver: '@priya_connects', lseFee: 0, lifesaverPayout: 0, status: 'DECLINED', date: 'May 4' },
]

const totalLSEFees = TRANSACTIONS.filter(t => t.status === 'ACCEPTED').reduce((acc, t) => acc + t.lseFee, 0)
const totalPayouts = TRANSACTIONS.filter(t => t.status === 'ACCEPTED').reduce((acc, t) => acc + t.lifesaverPayout, 0)
const totalOwed = totalLSEFees + totalPayouts

export default function AgentSpend() {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Spend</h1>
        <p className="text-gray-400 text-sm mt-1">This week</p>
      </div>

      {/* Total card */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
        <p className="text-gray-400 text-sm mb-1">Total Owed This Week</p>
        <p className="text-4xl font-extrabold">${totalOwed.toFixed(2)}</p>
        <p className="text-gray-500 text-xs mt-2">Charged every Sunday via Stripe</p>
      </div>

      {/* Breakdown */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Breakdown</p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'LSE Service Fees', value: `$${totalLSEFees.toFixed(2)}`, note: `${TRANSACTIONS.filter(t => t.status === 'ACCEPTED').length} accepted leads x $2.00` },
            { label: 'LifeSaver Payouts', value: `$${totalPayouts.toFixed(2)}`, note: 'Distributed to your LifeSavers' },
            { label: 'Leads Accepted', value: String(TRANSACTIONS.filter(t => t.status === 'ACCEPTED').length) },
            { label: 'Avg per Lead', value: `$${(totalOwed / Math.max(1, TRANSACTIONS.filter(t => t.status === 'ACCEPTED').length)).toFixed(2)}` },
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

      {/* Transaction log */}
      <div>
        <p className="text-sm font-bold mb-3">Transaction Log</p>
        <div className="flex flex-col gap-3">
          {TRANSACTIONS.map(({ id, lead, lifesaver, lseFee, lifesaverPayout, status, date }) => (
            <div key={id} className="bg-surface border border-gray-800 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{lead}</p>
                  <p className="text-xs text-gray-500">{lifesaver} - {date}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'ACCEPTED' ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-400'}`}>
                  {status}
                </span>
              </div>
              {status === 'ACCEPTED' && (
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  <span>LSE fee: <strong className="text-white">-${lseFee.toFixed(2)}</strong></span>
                  <span>Payout: <strong className="text-white">-${lifesaverPayout.toFixed(2)}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
