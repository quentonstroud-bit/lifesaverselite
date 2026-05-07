import React from 'react'
import { AlertTriangle, Clock, Users, Building2, List, Globe } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const ALERTS = [
  { type: 'warning', msg: '2 leads expiring within 6 hours' },
  { type: 'warning', msg: 'Agent "Rivera Insurance" budget below 20%' },
  { type: 'info', msg: '3 LifeSaver applications pending review' },
  { type: 'info', msg: '1 Agent application pending review' },
]

const POOL_PREVIEW = [
  { name: 'Raymond K.', policy: 'Life Insurance', stars: 4, hoursLeft: 4 },
  { name: 'Gloria M.', policy: 'Final Expense', stars: 3, hoursLeft: 19 },
  { name: 'Chris P.', policy: 'Medicare', stars: 5, hoursLeft: 40 },
]

export default function AdminOverview() {
  const weeklyTarget = 200
  const weeklyActual = 142

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, Quenton</p>
        </div>
        <span className="bg-primary/20 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full">Super Admin</span>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Active LifeSavers', value: 42 },
          { icon: Building2, label: 'Active Agents', value: 8 },
          { icon: List, label: 'Leads This Week', value: 31 },
          { icon: Globe, label: 'In General Pool', value: 3 },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className="text-gray-500" />
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
            <p className="text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      {/* Weekly revenue */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Weekly Revenue</p>
          <p className="text-xs text-gray-500">Target: ${weeklyTarget}</p>
        </div>
        <p className="text-3xl font-extrabold text-success mb-3">${weeklyActual}.00</p>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full" style={{ width: `${(weeklyActual / weeklyTarget) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{Math.round((weeklyActual / weeklyTarget) * 100)}% of weekly target</p>
      </div>

      {/* Alerts */}
      <div>
        <p className="text-sm font-bold mb-3">Active Alerts</p>
        <div className="flex flex-col gap-2">
          {ALERTS.map(({ type, msg }) => (
            <div key={msg} className={`flex items-start gap-3 rounded-xl px-4 py-3.5 border ${type === 'warning' ? 'bg-warning/10 border-warning/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
              <AlertTriangle size={15} className={type === 'warning' ? 'text-warning flex-shrink-0 mt-0.5' : 'text-indigo-400 flex-shrink-0 mt-0.5'} />
              <p className="text-sm text-gray-300">{msg}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pool preview */}
      <div>
        <p className="text-sm font-bold mb-3">General Pool Preview</p>
        <div className="flex flex-col gap-3">
          {POOL_PREVIEW.map(({ name, policy, stars, hoursLeft }) => (
            <div key={name} className={`bg-surface border rounded-xl px-5 py-4 flex items-center justify-between ${hoursLeft < 6 ? 'border-red-500/40' : 'border-gray-800'}`}>
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-gray-500 text-xs">{policy}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StarRating rating={stars} size={13} />
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={11} />
                  <span className={hoursLeft < 6 ? 'text-red-400 font-bold' : ''}>{hoursLeft}hr left</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
