import React from 'react'
import { Trophy, Zap } from 'lucide-react'

const MILESTONES = [
  { stars: 25, bonus: 5 },
  { stars: 50, bonus: 10 },
  { stars: 100, bonus: 25 },
  { stars: 250, bonus: 75 },
  { stars: 500, bonus: 200 },
]

const WEEKLY = [
  { week: 'May 5 to 11', leads: 3, multiplier: '3x', base: '$54.00', bonus: '$108.00', total: '$162.00' },
  { week: 'Apr 28 to May 4', leads: 2, multiplier: '1x', base: '$28.00', bonus: '$0.00', total: '$28.00' },
  { week: 'Apr 21 to 27', leads: 5, multiplier: '2x', base: '$70.00', bonus: '$70.00', total: '$140.00' },
]

const STARS_BALANCE = 47
const NEXT_MILESTONE = MILESTONES.find(m => m.stars > STARS_BALANCE) || MILESTONES[MILESTONES.length - 1]

export default function LSEarnings() {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Your performance summary</p>
      </div>

      {/* Total */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-1">All-Time Earnings</p>
        <p className="text-4xl font-extrabold text-white">$330.00</p>
        <p className="text-success text-sm mt-2">+$162.00 this week</p>
      </div>

      {/* STARS balance + milestones */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-warning" />
          <p className="font-bold">STARS Balance: {STARS_BALANCE}</p>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          {NEXT_MILESTONE.stars - STARS_BALANCE} more STARS to unlock ${NEXT_MILESTONE.bonus} milestone bonus.
        </p>

        <div className="flex flex-col gap-3">
          {MILESTONES.map(({ stars, bonus }) => {
            const reached = STARS_BALANCE >= stars
            const isNext = stars === NEXT_MILESTONE.stars
            return (
              <div key={stars} className={`flex items-center justify-between py-3 px-4 rounded-lg border ${reached ? 'border-success/30 bg-success/10' : isNext ? 'border-warning/30 bg-warning/10' : 'border-gray-800 bg-bg'}`}>
                <div className="flex items-center gap-3">
                  <Zap size={14} className={reached ? 'text-success' : isNext ? 'text-warning' : 'text-gray-600'} />
                  <span className="text-sm font-semibold">{stars} STARS</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${reached ? 'text-success' : 'text-gray-300'}`}>${bonus} bonus</span>
                  {reached && (
                    <button className="bg-success text-black text-xs font-bold px-3 py-1 rounded-full">
                      Claim
                    </button>
                  )}
                  {isNext && !reached && (
                    <span className="text-warning text-xs font-semibold">Next</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly breakdown */}
      <div>
        <p className="text-sm font-bold mb-3">Weekly Breakdown</p>
        <div className="flex flex-col gap-3">
          {WEEKLY.map(({ week, leads, multiplier, base, bonus, total }) => (
            <div key={week} className="bg-surface border border-gray-800 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{week}</p>
                <span className="text-warning text-xs font-bold bg-warning/20 px-2 py-0.5 rounded-full">{multiplier} multiplier</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-gray-500">Leads</p>
                  <p className="font-bold mt-0.5">{leads}</p>
                </div>
                <div>
                  <p className="text-gray-500">Base</p>
                  <p className="font-bold mt-0.5">{base}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-bold text-success mt-0.5">{total}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
