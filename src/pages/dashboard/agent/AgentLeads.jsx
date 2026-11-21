import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { CheckCircle, X, Clock, CreditCard } from 'lucide-react'
import StarRating from '../../../components/StarRating'
import { startPurchase, readPurchaseResult, money } from '../../../lib/purchase'
import { apiGet, apiPost } from '../../../lib/api'


export default function AgentLeads() {
  const { user }   = useAuth()
  const [leads,    setLeads]    = useState([])
  const [stats,    setStats]    = useState({ accepted: 0, declined: 0 })
  const [loading,  setLoading]  = useState(true)
  const [accepted, setAccepted] = useState(null)
  const [buyingId, setBuyingId] = useState(null)
  const [error,    setError]    = useState('')
  const [banner,   setBanner]   = useState(() => readPurchaseResult())

  function fetchLeads() {
    if (!user?.email) { setLoading(false); return }
    apiGet('agent_leads')
      .then(d => {
        setLeads(d.leads || [])
        setStats({ accepted: d.accepted || 0, declined: d.declined || 0 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchLeads() }, [user?.email])

  async function buyLead(lead) {
    setError('')
    setBuyingId(lead.id)
    try {
      const r = await startPurchase(lead)
      if (r.free) {
        setLeads(p => p.filter(l => l.id !== lead.id))
        setAccepted(lead)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBuyingId(null)
    }
  }

  async function declineLead(lead) {
    setError('')
    try {
      await apiPost('lead_decline', { leadId: lead.id })
      setLeads(p => p.filter(l => l.id !== lead.id))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Incoming Leads</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accepted', value: loading ? '…' : stats.accepted },
          { label: 'Declined', value: loading ? '…' : stats.declined },
          { label: 'In Queue', value: loading ? '…' : leads.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {banner === 'success' && (
        <div className="bg-success/10 border border-success/30 text-success text-sm rounded-xl px-4 py-3">
          Payment received. Full contact details are being emailed to you now. The lead will leave this list once the purchase is recorded.
        </div>
      )}
      {banner === 'cancelled' && (
        <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-xl px-4 py-3">Checkout cancelled. You have not been charged.</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Instructions */}
      <div className="flex items-center justify-between text-xs text-gray-600 px-1">
        <span className="flex items-center gap-1"><X size={12} className="text-red-500" /> Decline to pass</span>
        <span className="flex items-center gap-1"><CreditCard size={12} className="text-success" /> Buy to unlock contact</span>
      </div>

      {/* Lead cards */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <CheckCircle size={40} className="mx-auto mb-4 text-gray-700" />
          <p className="font-semibold">No leads in queue right now.</p>
          <p className="text-xs mt-1">New referrals will appear here as your LifeSavers submit them.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} buying={buyingId === lead.id} onBuy={() => buyLead(lead)} onDecline={() => declineLead(lead)} />
          ))}
        </div>
      )}

      {/* Accepted modal */}
      {accepted && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-success/30 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-success" />
              <h2 className="text-lg font-bold">Lead Unlocked</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Contact info unlocked for {accepted.firstName} {accepted.lastInitial}.
            </p>
            <div className="bg-bg rounded-xl p-4 flex flex-col gap-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Policy</span>
                <span className="font-semibold">{accepted.policy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">From</span>
                <span className="font-semibold">{accepted.lifesaverHandle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Charged</span>
                <span className="text-primary font-semibold">{money(accepted.total)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">Full contact details will be emailed to you.</p>
            <button onClick={() => setAccepted(null)} className="w-full bg-success/20 border border-success/30 text-success font-bold py-3 rounded-xl">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, buying, onBuy, onDecline }) {
  const urgent   = lead.hoursLeft < 8
  const almostDue = lead.hoursLeft < 24

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${urgent ? 'border-red-500/50' : almostDue ? 'border-warning/40' : 'border-gray-800'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-lg">{lead.firstName} {lead.lastInitial}.</p>
            <p className="text-gray-400 text-sm">{lead.city}, {lead.state}</p>
          </div>
          <div className="text-right">
            {lead.stars > 0 && <StarRating rating={lead.stars} />}
            <div className={`flex items-center gap-1 mt-1 ${urgent ? 'text-red-400' : 'text-gray-400'}`}>
              <Clock size={12} />
              <span className="text-xs font-semibold">{lead.hoursLeft}hr left</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          {[
            { label: 'Age',           value: lead.age },
            { label: 'Health',        value: `${lead.health}/10` },
            { label: 'Smoking',       value: lead.smoking },
            { label: 'Beneficiaries', value: lead.beneficiaries },
            { label: 'Policy',        value: lead.policy },
            { label: 'Timeline',      value: lead.timeline },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bg rounded-lg px-3 py-2">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="font-semibold text-xs mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>From {lead.lifesaverHandle}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-gray-600">Phone</p>
            <p className="text-gray-500 font-mono mt-0.5">XXX-XXX-XXXX</p>
          </div>
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-gray-600">Email</p>
            <p className="text-gray-500 font-mono mt-0.5">x****@*****.com</p>
          </div>
        </div>

        {lead.notes && (
          <div className="bg-bg border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-400 mb-4">
            <p className="text-gray-600 mb-0.5">Notes</p>
            {lead.notes}
          </div>
        )}

        <div className="bg-bg rounded-lg px-3 py-2.5 text-xs mb-3 flex justify-between items-center">
          {lead.total > 0 ? (
            <>
              <span className="text-gray-500">Lead {money(lead.price)} + {money(lead.fee)} service fee</span>
              <span className="font-bold text-white">{money(lead.total)}</span>
            </>
          ) : (
            <>
              <span className="text-gray-500">1-star lead</span>
              <span className="font-bold text-success">Free</span>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onDecline} className="flex-1 flex items-center justify-center gap-2 border border-red-500/40 text-red-400 py-3 rounded-xl text-sm font-semibold hover:bg-red-500/10 transition-colors">
            <X size={16} /> Decline
          </button>
          <button onClick={onBuy} disabled={buying} className="flex-1 flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success py-3 rounded-xl text-sm font-semibold hover:bg-success/30 disabled:opacity-60 transition-colors">
            <CreditCard size={16} /> {buying ? 'Please wait...' : lead.total > 0 ? `Buy ${money(lead.total)}` : 'Unlock Free'}
          </button>
        </div>
      </div>
    </div>
  )
}
