import React, { useState } from 'react'
import { CheckCircle, X, AlertTriangle, ChevronDown } from 'lucide-react'

const PENDING = [
  { id: 'ap1', name: 'Thomas Wick', agency: 'Wick Benefits Group', email: 'thomas@wickbenefits.com', submitted: 'May 7, 2026' },
]

const ACTIVE_AGENTS = [
  { id: 'ag1', agency: 'Rivera Insurance Group', name: 'Marcus Rivera', budget: 100, remaining: 82, lifesavers: 4, accepted: 8, declined: 2, spend: 54.50 },
  { id: 'ag2', agency: 'Summit Life Partners', name: 'Carla Nguyen', budget: 250, remaining: 48, lifesavers: 9, accepted: 24, declined: 4, spend: 140.00 },
  { id: 'ag3', agency: 'Greenway Financial', name: 'Robert Dawson', budget: 50, remaining: 8, lifesavers: 2, accepted: 3, declined: 1, spend: 28.00 },
]

export default function AdminAgents() {
  const [pending, setPending] = useState(PENDING)
  const [openManage, setOpenManage] = useState(null)

  function approve(id) { setPending(p => p.filter(a => a.id !== id)) }
  function decline(id) { setPending(p => p.filter(a => a.id !== id)) }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Agents/Brokers</h1>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-bold">Pending Applications</p>
            <span className="bg-warning text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
          </div>
          {pending.map(({ id, name, agency, email, submitted }) => (
            <div key={id} className="bg-surface border border-warning/30 rounded-xl px-5 py-4">
              <p className="font-semibold text-sm">{agency}</p>
              <p className="text-gray-500 text-xs">{name} - {email}</p>
              <p className="text-gray-600 text-xs mb-3">Applied {submitted}</p>
              <div className="flex gap-3">
                <button onClick={() => decline(id)} className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/40 text-red-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-red-500/10 transition-colors">
                  <X size={13} /> Decline
                </button>
                <button onClick={() => approve(id)} className="flex-1 flex items-center justify-center gap-1.5 bg-success/20 border border-success/30 text-success py-2.5 rounded-lg text-xs font-semibold hover:bg-success/30 transition-colors">
                  <CheckCircle size={13} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active roster */}
      <div>
        <p className="text-sm font-bold mb-3">Active Agents ({ACTIVE_AGENTS.length})</p>
        <div className="flex flex-col gap-3">
          {ACTIVE_AGENTS.map(({ id, agency, name, budget, remaining, lifesavers, accepted, declined, spend }) => {
            const pct = (remaining / budget) * 100
            const lowBudget = pct < 20
            return (
              <div key={id} className={`bg-surface border rounded-xl overflow-hidden ${lowBudget ? 'border-warning/40' : 'border-gray-800'}`}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{agency}</p>
                        {lowBudget && <AlertTriangle size={13} className="text-warning" />}
                      </div>
                      <p className="text-gray-500 text-xs">{name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className={`text-sm font-bold ${lowBudget ? 'text-warning' : 'text-white'}`}>${remaining} / ${budget}</p>
                    </div>
                  </div>

                  <div className="h-1.5 bg-bg rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${lowBudget ? 'bg-warning' : 'bg-success'}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    {[
                      { label: 'LifeSavers', value: lifesavers },
                      { label: 'Accepted', value: accepted },
                      { label: 'Declined', value: declined },
                      { label: 'Spend', value: `$${spend}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg rounded-lg py-2">
                        <p className="text-gray-600">{label}</p>
                        <p className="font-bold mt-0.5 text-xs">{value}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setOpenManage(openManage === id ? null : id)}
                    className="w-full flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 py-2 rounded-lg text-xs hover:border-gray-500 transition-colors">
                    Manage <ChevronDown size={13} className={`transition-transform ${openManage === id ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {openManage === id && (
                  <div className="border-t border-gray-800 bg-bg px-5 py-3 flex flex-col gap-2">
                    {['View Documents', 'Reassign LifeSavers', 'Deactivate Account'].map(action => (
                      <button key={action} className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${action.includes('Deactivate') ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
