import React, { useState } from 'react'
import { CheckCircle, X, Clock, AlertTriangle, CreditCard } from 'lucide-react'
import StarRating from '../../../components/StarRating'

const INITIAL_LEADS = [
  {
    id: 1, firstName: 'Sandra', lastInitial: 'W', city: 'Austin', state: 'TX',
    hoursLeft: 31, stars: 4, age: 42, health: 8, smoking: 'Non-Smoker',
    beneficiaries: 2, policy: 'Life Insurance', timeline: '1 to 3 months',
    lifesaverHandle: '@jordansmith', submittedAgo: '17 hours ago',
    notes: 'Very interested, asked about term vs whole life. Has two kids.',
    phone: 'XXX-XXX-XXXX', email: 'x****@*****.com',
  },
  {
    id: 2, firstName: 'Derek', lastInitial: 'H', city: 'Oklahoma City', state: 'OK',
    hoursLeft: 8, stars: 3, age: 55, health: 6, smoking: 'Former Smoker',
    beneficiaries: 1, policy: 'Final Expense', timeline: '3 to 6 months',
    lifesaverHandle: '@priya_connects', submittedAgo: '40 hours ago',
    notes: 'Open to hearing more. Retired, fixed income.',
    phone: 'XXX-XXX-XXXX', email: 'x****@*****.com',
  },
  {
    id: 3, firstName: 'Amy', lastInitial: 'C', city: 'Dallas', state: 'TX',
    hoursLeft: 44, stars: 5, age: 61, health: 9, smoking: 'Non-Smoker',
    beneficiaries: 3, policy: 'Medicare', timeline: '1 to 3 months',
    lifesaverHandle: '@danielleking', submittedAgo: '4 hours ago',
    notes: 'Ready to talk this week. Turning 65 next month.',
    phone: 'XXX-XXX-XXXX', email: 'x****@*****.com',
  },
]

const PENDING_BUDGET = [
  { id: 99, firstName: 'James', lastInitial: 'M', hoursLeft: 18, stars: 3 },
]

export default function AgentLeads() {
  const [leads, setLeads] = useState(INITIAL_LEADS)
  const [accepted, setAccepted] = useState(null)
  const [dragState, setDragState] = useState({})
  const budget = { used: 6, total: 50 }
  const pct = (budget.used / budget.total) * 100

  function acceptLead(id) {
    const lead = leads.find(l => l.id === id)
    setAccepted(lead)
    setLeads(p => p.filter(l => l.id !== id))
  }

  function declineLead(id) {
    setLeads(p => p.filter(l => l.id !== id))
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Incoming Leads</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Accepted', value: 3 },
          { label: 'Declined', value: 1 },
          { label: 'In Queue', value: leads.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Budget meter */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Weekly Budget</p>
          <button className="text-xs text-primary font-semibold flex items-center gap-1">
            <CreditCard size={12} /> Top Up
          </button>
        </div>
        <div className="h-2 bg-bg rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>${budget.used}.00 used</span>
          <span>${budget.total}.00 budget</span>
        </div>
      </div>

      {/* Pending budget tray */}
      {PENDING_BUDGET.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning" />
            <p className="text-sm font-bold text-warning">Pending Budget ({PENDING_BUDGET.length})</p>
          </div>
          {PENDING_BUDGET.map(({ id, firstName, lastInitial, hoursLeft, stars }) => (
            <div key={id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{firstName} {lastInitial}.</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} className="text-warning" />
                  <span className="text-warning text-xs">{hoursLeft}hr to act or lead releases</span>
                </div>
              </div>
              <button className="bg-warning text-black text-xs font-bold px-3 py-1.5 rounded-lg">Top Up</button>
            </div>
          ))}
        </div>
      )}

      {/* Swipe instructions */}
      <div className="flex items-center justify-between text-xs text-gray-600 px-1">
        <span className="flex items-center gap-1"><X size={12} className="text-red-500" /> Swipe left to decline</span>
        <span className="flex items-center gap-1"><CheckCircle size={12} className="text-success" /> Swipe right to accept</span>
      </div>

      {/* Lead cards */}
      <div className="flex flex-col gap-4">
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onAccept={() => acceptLead(lead.id)} onDecline={() => declineLead(lead.id)} />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <CheckCircle size={40} className="mx-auto mb-4 text-gray-700" />
            <p className="font-semibold">All caught up</p>
            <p className="text-xs mt-1">No leads in queue right now.</p>
          </div>
        )}
      </div>

      {/* Accepted modal */}
      {accepted && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-success/30 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-success" />
              <h2 className="text-lg font-bold">Lead Accepted</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Contact info unlocked for {accepted.firstName} {accepted.lastInitial}.</p>
            <div className="bg-bg rounded-xl p-4 flex flex-col gap-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold">(512) 555-0192</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold">s.williams@email.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">LSE fee</span>
                <span className="text-primary font-semibold">-$2.00</span>
              </div>
            </div>
            <button onClick={() => setAccepted(null)} className="w-full bg-success/20 border border-success/30 text-success font-bold py-3 rounded-xl">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadCard({ lead, onAccept, onDecline }) {
  const urgent = lead.hoursLeft < 8
  const almostDue = lead.hoursLeft < 24

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden ${urgent ? 'border-red-500/50' : almostDue ? 'border-warning/40' : 'border-gray-800'}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-bold text-lg">{lead.firstName} {lead.lastInitial}.</p>
            <p className="text-gray-400 text-sm">{lead.city}, {lead.state}</p>
          </div>
          <div className="text-right">
            <StarRating rating={lead.stars} />
            <div className={`flex items-center gap-1 mt-1 ${urgent ? 'text-red-400' : 'text-gray-400'}`}>
              <Clock size={12} />
              <span className="text-xs font-semibold">{lead.hoursLeft}hr left</span>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          {[
            { label: 'Age', value: lead.age },
            { label: 'Health', value: `${lead.health}/10` },
            { label: 'Smoking', value: lead.smoking },
            { label: 'Beneficiaries', value: lead.beneficiaries },
            { label: 'Policy', value: lead.policy },
            { label: 'Timeline', value: lead.timeline },
          ].map(({ label, value }) => (
            <div key={label} className="bg-bg rounded-lg px-3 py-2">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="font-semibold text-xs mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* LifeSaver + blurred contact */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>From {lead.lifesaverHandle}</span>
          <span>{lead.submittedAgo}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-gray-600">Phone</p>
            <p className="text-gray-500 font-mono mt-0.5">{lead.phone}</p>
          </div>
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-gray-600">Email</p>
            <p className="text-gray-500 font-mono mt-0.5">{lead.email}</p>
          </div>
        </div>

        {lead.notes && (
          <div className="bg-bg border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-400 mb-4">
            <p className="text-gray-600 mb-0.5">Notes</p>
            {lead.notes}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button onClick={onDecline} className="flex-1 flex items-center justify-center gap-2 border border-red-500/40 text-red-400 py-3 rounded-xl text-sm font-semibold hover:bg-red-500/10 transition-colors">
            <X size={16} /> Decline
          </button>
          <button onClick={onAccept} className="flex-1 flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success py-3 rounded-xl text-sm font-semibold hover:bg-success/30 transition-colors">
            <CheckCircle size={16} /> Accept
          </button>
        </div>
      </div>
    </div>
  )
}
