import React, { useState } from 'react'
import { CheckCircle, X, ChevronDown } from 'lucide-react'

const PENDING = [
  { id: 'p1', name: 'Maria Gonzalez', email: 'maria@email.com', phone: '(555) 123-4567', submitted: 'May 7, 2026' },
  { id: 'p2', name: 'Kevin Park', email: 'kevin@email.com', phone: '(555) 234-5678', submitted: 'May 6, 2026' },
  { id: 'p3', name: 'Sharon Cole', email: 'sharon@email.com', phone: '(555) 345-6789', submitted: 'May 5, 2026' },
]

const ACTIVE = [
  { handle: '@jordansmith', name: 'Jordan Smith', tier: 'Star 3', submitted: 12, accepted: 8, rate: 67, earnings: '$142.00', agent: 'Rivera Insurance' },
  { handle: '@danielleking', name: 'Danielle King', tier: 'Star 5 Elite', submitted: 38, accepted: 34, rate: 89, earnings: '$612.00', agent: 'Rivera Insurance' },
  { handle: '@priya_connects', name: 'Priya Sharma', tier: 'Star 2', submitted: 7, accepted: 3, rate: 43, earnings: '$48.00', agent: 'Rivera Insurance' },
  { handle: '@tylerb', name: 'Tyler Briggs', tier: 'Star 1', submitted: 3, accepted: 1, rate: 33, earnings: '$12.00', agent: 'Rivera Insurance' },
]

export default function AdminLifeSavers() {
  const [pending, setPending] = useState(PENDING)
  const [openManage, setOpenManage] = useState(null)

  function approve(id) { setPending(p => p.filter(a => a.id !== id)) }
  function decline(id) { setPending(p => p.filter(a => a.id !== id)) }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">LifeSavers</h1>
      </div>

      {/* Pending applications */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-bold">Pending Applications</p>
            <span className="bg-warning text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {pending.map(({ id, name, email, phone, submitted }) => (
              <div key={id} className="bg-surface border border-warning/30 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{email}</p>
                    <p className="text-gray-600 text-xs">{phone} - Applied {submitted}</p>
                  </div>
                </div>
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
        </div>
      )}

      {/* Active roster */}
      <div>
        <p className="text-sm font-bold mb-3">Active Roster ({ACTIVE.length})</p>
        <div className="flex flex-col gap-3">
          {ACTIVE.map(({ handle, name, tier, submitted, accepted, rate, earnings, agent }) => (
            <div key={handle} className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">{name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-gray-500 text-xs">{handle}</p>
                    </div>
                  </div>
                  <span className="text-warning text-xs font-bold bg-warning/20 px-2 py-0.5 rounded-full">{tier}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  {[
                    { label: 'Submitted', value: submitted },
                    { label: 'Accepted', value: accepted },
                    { label: 'Rate', value: `${rate}%` },
                    { label: 'Earnings', value: earnings },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-bg rounded-lg py-2">
                      <p className="text-gray-600">{label}</p>
                      <p className="font-bold mt-0.5 text-xs">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setOpenManage(openManage === handle ? null : handle)}
                  className="w-full flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 py-2 rounded-lg text-xs hover:border-gray-500 transition-colors">
                  Manage <ChevronDown size={13} className={`transition-transform ${openManage === handle ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {openManage === handle && (
                <div className="border-t border-gray-800 bg-bg px-5 py-3 flex flex-col gap-2">
                  <p className="text-xs text-gray-500 mb-1">Assigned to: {agent}</p>
                  {['Reassign Agent/Broker', 'Advance Tier Manually', 'Deactivate Account'].map(action => (
                    <button key={action} className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${action.includes('Deactivate') ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
