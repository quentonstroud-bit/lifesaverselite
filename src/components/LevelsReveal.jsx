import React from 'react'
import { Award, Star } from 'lucide-react'

// Shown during onboarding (Training) once the Compensation module is complete.
export const STAR_INFO = [
  { stars: 5, price: 30, title: 'Top quality', text: 'Ready to buy in 1-3 months, beneficiaries listed, responsive, wants a specific policy.' },
  { stars: 4, price: 24, title: 'Good', text: 'Interested but needs a little nurturing: unsure on policy type or beneficiaries not final.' },
  { stars: 3, price: 18, title: 'Medium', text: 'Some interest, not committed. Comparing options and needs more information.' },
  { stars: 2, price: 5, title: 'Low', text: 'Very early in research, loosely interested, not ready to engage yet.' },
  { stars: 1, price: 0, title: 'Lowest', text: 'Missing basics (no beneficiaries, unsure what they want, unresponsive). Earns nothing and does not count toward levels.' },
]

export const LEVELS = [
  { name: 'Supporter', range: '0-24 leads', bonus: null, perks: ['Start earning on every 2-star-or-better lead'] },
  { name: 'Steward', range: '25-59 leads', bonus: 50, perks: ['Branded swag: T-shirt, water bottle or other merchandise', 'A personal thank-you note'] },
  { name: 'Specialist', range: '60-99 leads', bonus: 100, perks: ['Priority access to future training and coaching', 'Lead-sharing toolkit to expand your reach'] },
  { name: 'Sentinel', range: '100+ leads', bonus: 250, perks: ['VIP gift box', 'Priority support and a 1:1 coaching session', 'Featured social post, digital badge, certificate and plaque'] },
  { name: 'Supreme', range: '500+ leads, top of the month', bonus: 500, perks: ['One-time $500 bonus the first month you take the title', 'Luxury gift or experience and the mastermind group', 'Featured everywhere, VIP event access, custom Supreme badge', 'There can be only one each month: stay on top to keep the title'] },
]

export default function LevelsReveal() {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-surface border border-success/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Award size={18} className="text-success" />
          <p className="font-bold">Unlocked: How you earn</p>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Every referral is rated 1 to 5 stars automatically from the details you submit. The more questions you answer well, the higher the rating, and the more you earn.
        </p>
        <div className="flex flex-col gap-3">
          {STAR_INFO.map(({ stars, price, title, text }) => (
            <div key={stars} className="bg-bg rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex">{Array.from({ length: stars }, (_, i) => <Star key={i} size={13} fill="#f59e0b" stroke="#f59e0b" />)}</span>
                  <span className="text-sm font-bold">{title}</span>
                </div>
                <span className={`text-sm font-bold ${price ? 'text-success' : 'text-gray-500'}`}>{price ? `$${price}` : '$0'}</span>
              </div>
              <p className="text-xs text-gray-400">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">You earn the amount shown when an agent buys your lead, less payment processing fees. Earnings are banked and paid weekly on Sunday.</p>
      </div>

      <div className="bg-surface border border-warning/30 rounded-2xl p-5">
        <p className="font-bold mb-1">Your LifeSaver Levels</p>
        <p className="text-gray-400 text-sm mb-4">Levels count the leads you submit that are rated 2 stars or higher. Cash bonuses are paid once, the moment you reach each level.</p>
        <div className="flex flex-col gap-3">
          {LEVELS.map(({ name, range, bonus, perks }) => (
            <div key={name} className="bg-bg rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-xs text-gray-500">{range}</p>
                </div>
                {bonus ? <span className="text-warning font-bold text-sm">${bonus} bonus</span> : <span className="text-gray-600 text-xs">Starting level</span>}
              </div>
              <ul className="text-xs text-gray-400 list-disc pl-4 flex flex-col gap-1">
                {perks.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
