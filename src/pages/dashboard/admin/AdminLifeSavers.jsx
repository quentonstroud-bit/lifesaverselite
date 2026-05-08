import React, { useState, useEffect } from 'react'
import { CheckCircle, X, ChevronDown } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

export default function AdminLifeSavers() {
  const [pending,    setPending]    = useState([])
  const [active,     setActive]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [openManage, setOpenManage] = useState(null)

  function fetchData() {
    if (!WEBAPP_URL) { setLoading(false); return }
    fetch(`${WEBAPP_URL}?query=admin_lifesavers`)
      .then(r => r.json())
      .then(d => {
        setPending(d.pending || [])
        setActive(d.active   || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function approve(id) {
    setPending(p => p.filter(a => a.id !== id))
    if (WEBAPP_URL) {
      try {
        await fetch(WEBAPP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formType: 'approve_lifesaver', id })
        })
      } catch {}
    }
  }

  function decline(id) { setPending(p => p.filter(a => a.id !== id)) }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">LifeSavers</h1>
      </div>

      {/* Pending applications */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-bold">Pending Applications</p>
            <span className="bg-warning text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {pending.map(({ id, name, email, phone, submitted }) => (
              <div key={id} className="bg-surface border border-warning/30 rounded-xl px-5 py-4">
                <div className="mb-3">
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{email}</p>
                  {phone && <p className="text-gray-600 text-xs">{phone}</p>}
                  <p className="text-gray-600 text-xs">Applied {submitted}</p>
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
        <p className="text-sm font-bold mb-3">
          Active Roster ({loading ? '…' : active.length})
        </p>
        {!loading && active.length === 0 ? (
          <p className="text-gray-500 text-sm">No active LifeSavers yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map(ls => (
              <div key={ls.id} className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{ls.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{ls.name}</p>
                        <p className="text-gray-500 text-xs">{ls.handle || ls.email}</p>
                      </div>
                    </div>
                    <span className="text-warning text-xs font-bold bg-warning/20 px-2 py-0.5 rounded-full">
                      {ls.tier || 'Star 1'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    {[
                      { label: 'Submitted', value: ls.submitted },
                      { label: 'Accepted',  value: ls.accepted },
                      { label: 'Rate',      value: ls.submitted > 0 ? `${Math.round((ls.accepted / ls.submitted) * 100)}%` : '--' },
                      { label: 'Earnings',  value: `$${(ls.earnings || 0).toFixed(2)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg rounded-lg py-2">
                        <p className="text-gray-600">{label}</p>
                        <p className="font-bold mt-0.5 text-xs">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOpenManage(openManage === ls.id ? null : ls.id)}
                    className="w-full flex items-center justify-center gap-1.5 border border-gray-700 text-gray-400 py-2 rounded-lg text-xs hover:border-gray-500 transition-colors">
                    Manage <ChevronDown size={13} className={`transition-transform ${openManage === ls.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {openManage === ls.id && (
                  <div className="border-t border-gray-800 bg-bg px-5 py-3 flex flex-col gap-2">
                    {ls.agentName && <p className="text-xs text-gray-500 mb-1">Assigned to: {ls.agentName}</p>}
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
        )}
      </div>
    </div>
  )
}
