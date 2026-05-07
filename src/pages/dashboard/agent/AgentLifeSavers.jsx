import React from 'react'
import { Users, DollarSign } from 'lucide-react'

const LIFESAVERS = [
  { handle: '@jordansmith', name: 'Jordan Smith', submitted: 6, accepted: 4, rate: 67, payout: 64.00 },
  { handle: '@danielleking', name: 'Danielle King', submitted: 3, accepted: 3, rate: 100, payout: 54.50 },
  { handle: '@priya_connects', name: 'Priya Sharma', submitted: 5, accepted: 2, rate: 40, payout: 24.00 },
  { handle: '@tylerb', name: 'Tyler Briggs', submitted: 2, accepted: 1, rate: 50, payout: 12.00 },
]

const totalPayout = LIFESAVERS.reduce((acc, ls) => acc + ls.payout, 0)

export default function AgentLifeSavers() {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">My LifeSavers</h1>
        <p className="text-gray-400 text-sm mt-1">{LIFESAVERS.length} assigned partners</p>
      </div>

      {/* Total payout */}
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Total Payout Due Sunday</p>
          <p className="text-2xl font-extrabold mt-1">${totalPayout.toFixed(2)}</p>
        </div>
        <DollarSign size={28} className="text-warning" />
      </div>

      {/* LifeSaver list */}
      <div className="flex flex-col gap-3">
        {LIFESAVERS.map(({ handle, name, submitted, accepted, rate, payout }) => (
          <div key={handle} className="bg-surface border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm">{name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{handle}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 70 ? 'bg-success/20 text-success' : rate >= 50 ? 'bg-warning/20 text-warning' : 'bg-red-500/20 text-red-400'}`}>
                {rate}% accepted
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-bg rounded-lg py-2">
                <p className="text-gray-500">Submitted</p>
                <p className="font-bold mt-0.5">{submitted}</p>
              </div>
              <div className="bg-bg rounded-lg py-2">
                <p className="text-gray-500">Accepted</p>
                <p className="font-bold mt-0.5">{accepted}</p>
              </div>
              <div className="bg-bg rounded-lg py-2">
                <p className="text-gray-500">Payout Owed</p>
                <p className="font-bold text-success mt-0.5">${payout.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
