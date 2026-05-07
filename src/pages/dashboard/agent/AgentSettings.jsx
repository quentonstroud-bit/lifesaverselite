import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Bell, LogOut, Shield, FileText } from 'lucide-react'

const BUDGET_TIERS = ['$50', '$100', '$250', '$500', '$1,000', 'Custom']

const NOTIF_TOGGLES = [
  { key: 'newLeads', label: 'New leads' },
  { key: 'expiry48', label: '48hr expiry alerts' },
  { key: 'budgetExhausted', label: 'Budget exhausted' },
  { key: 'weeklyInvoice', label: 'Weekly invoice' },
  { key: 'lifesaverPayouts', label: 'LifeSaver payout reminders' },
]

export default function AgentSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [budget, setBudget] = useState('$100')
  const [notifications, setNotifications] = useState({ newLeads: true, expiry48: true, budgetExhausted: true, weeklyInvoice: false, lifesaverPayouts: true })

  function toggleNotif(key) {
    setNotifications(p => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Agent profile */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Agent Profile</p>
        <p className="font-bold">{user?.name}</p>
        <p className="text-gray-400 text-sm">{user?.agency}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-success"><Shield size={12} /> License Active</span>
          <span className="flex items-center gap-1.5 text-xs text-success"><Shield size={12} /> E&O Current</span>
        </div>
      </div>

      {/* Weekly budget */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Weekly Budget</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {BUDGET_TIERS.map(tier => (
            <button key={tier} onClick={() => setBudget(tier)}
              className={`py-2.5 px-3 rounded-lg text-sm font-semibold border transition-colors ${budget === tier ? 'bg-primary border-primary text-white' : 'bg-bg border-gray-700 text-gray-400 hover:border-gray-500'}`}>
              {tier}
            </button>
          ))}
        </div>
        <div className="bg-bg border border-gray-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Current plan: {budget}/week</p>
            <p className="text-gray-500 text-xs mt-0.5">Charged every Sunday via Stripe</p>
          </div>
          <button className="flex items-center gap-1.5 bg-primary hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            <CreditCard size={12} /> Manage
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={15} className="text-gray-500" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</p>
        </div>
        <div className="flex flex-col gap-3">
          {NOTIF_TOGGLES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{label}</span>
              <button onClick={() => toggleNotif(key)}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifications[key] ? 'bg-primary' : 'bg-gray-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[key] ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
        {[
          { icon: FileText, label: 'View Platform Agreement' },
          { icon: FileText, label: 'Download Invoice' },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-bg/50 transition-colors text-left">
            <Icon size={16} className="text-gray-500" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      <button onClick={() => { logout(); navigate('/') }} className="flex items-center justify-center gap-2 w-full border border-gray-700 text-gray-400 py-4 rounded-xl hover:border-gray-500 hover:text-white transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
