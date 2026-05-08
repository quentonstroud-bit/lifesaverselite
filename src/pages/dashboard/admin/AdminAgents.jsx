import React, { useState, useEffect } from 'react'
import { CheckCircle, X, AlertTriangle, ChevronDown } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export default function AdminAgents() {
  const [pending,    setPending]    = useState([])
  const [active,     setActive]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [openManage, setOpenManage] = useState(null)

  useEffect(() => {
    if (!WEBAPP_URL) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=admin_agents`)
      .then(r => r.json())
      .then(d => {
        setPending(d.pending || [])
        setActive(d.active   || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function approve(id) { setPending(p => p.filter(a => a.id !== id)) }
  function decline(id) { setPending(p => p.filter(a => a.id !== id)) }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Agents / Brokers</h1>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold">Pending Applications</p>
                <span className="bg-warning text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
              </div>
              {pending.map(({ id, name, agency, email, phone, submitted, license, states, lines }) => (
                <div key={id} className="bg-surface border border-warning/30 rounded-xl px-5 py-4 mb-3">
                  <p className="font-semibold text-sm">{agency || name}</p>
                  <p className="text-gray-500 text-xs">{name} · {email}</p>
                  {phone && <p className="text-gray-600 text-xs">{phone}</p>}
                  {license && <p className="text-gray-600 text-xs">NPN: {license}</p>}
                  {states && <p className="text-gray-600 text-xs">States: {Array.isArray(states) ? states.join(', ') : states}</p>}
                  {lines && <p className="text-gray-600 text-xs">Lines: {lines}</p>}
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
            <p className="text-sm font-bold mb-3">Active Agents ({active.length})</p>
            {active.length === 0 ? (
              <p className="text-gray-500 text-sm">No active agents yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {active.map(ag => {
                  const budgetPct  = ag.budget > 0 ? (ag.remaining / ag.budget) * 100 : 100
                  const lowBudget  = budgetPct < 20
                  return (
                    <div key={ag.id} className={`bg-surface border rounded-xl overflow-hidden ${lowBudget ? 'border-warning/40' : 'border-gray-800'}`}>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{ag.agency || ag.name}</p>
                              {lowBudget && <AlertTriangle size={13} className="text-warning" />}
                            </div>
                            <p className="text-gray-500 text-xs">{ag.name}</p>
                          </div>
                          {ag.budget > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Budget</p>
                              <p className={`text-sm font-bold ${lowBudget ? 'text-warning' : 'text-white'}`}>${ag.remaining} / ${ag.budget}</p>
                            </div>
                          )}
                        </div>

                        {ag.budget > 0 && (
                          <div className="h-1.5 bg-bg rounded-full overflow-hidden mb-3">
                            <div className={`h-full rounded-full ${lowBudget ? 'bg-warning' : 'bg-success'}`} style={{ width: `${budgetPct}%` }} />
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                          {[
                            { label: 'LifeSavers', value: ag.lifesavers || 0 },
                            { label: 'Accepted',   value: ag.accepted   || 0 },
                            { label: 'Declined',   value: ag.declined   || 0 },
                            { label: 'Spend',      value: `$${(ag.spend || 0).toFixed(2)}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-bg rounded-lg py-2">
                              <p className="text-gray-600">{label}</p>
                              <p className="font-bold mt-0.5 text-xs">{value}</p>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => setOpenManage(openManage === ag.id ? null : ag.id)}
                          className="w-full flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 py-2 rounded-lg text-xs hover:border-gray-500 transition-colors">
                          Manage <ChevronDown size={13} className={`transition-transform ${openManage === ag.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {openManage === ag.id && (
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
            )}
          </div>
        </>
      )}
    </div>
  )
}
