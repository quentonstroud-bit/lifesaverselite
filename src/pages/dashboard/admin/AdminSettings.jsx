import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Download, LogOut, Bell, DollarSign } from 'lucide-react'

const NOTIF_TOGGLES = [
  { key: 'newApps', label: 'New LifeSaver applications' },
  { key: 'agentApps', label: 'New Agent applications' },
  { key: 'expiring', label: 'Leads expiring soon' },
  { key: 'lowBudget', label: 'Agent low budget alerts' },
  { key: 'inactive', label: 'Inactive LifeSaver alerts' },
]

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [fee, setFee] = useState('2.00')
  const [notifications, setNotifications] = useState({ newApps: true, agentApps: true, expiring: true, lowBudget: true, inactive: false })

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Admin profile */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-lg">Q</span>
        </div>
        <div>
          <p className="font-bold">{user?.name || 'Quenton Stroud'}</p>
          <p className="text-gray-400 text-sm">Executive Manager</p>
          <span className="text-primary text-xs font-bold">Super Admin</span>
        </div>
      </div>

      {/* Platform fee */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={15} className="text-gray-500" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Service Fee</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">$</span>
          <input type="number" step="0.50" min="0.50" value={fee} onChange={e => setFee(e.target.value)}
            className="bg-bg border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary w-28" />
          <span className="text-gray-500 text-sm">per accepted lead</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">Changes apply to new leads only. Existing leads retain their current fee.</p>
        <button className="mt-3 bg-primary hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
          Save Fee
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={15} className="text-gray-500" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notification Rules</p>
        </div>
        <div className="flex flex-col gap-3">
          {NOTIF_TOGGLES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{label}</span>
              <button onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${notifications[key] ? 'bg-primary' : 'bg-gray-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[key] ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CSV exports */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">CSV Exports</p>
        <div className="flex flex-col gap-2">
          {['Weekly Lead Report', 'Revenue Report', 'LifeSaver Roster', 'Payout Summary'].map(label => (
            <button key={label} className="flex items-center gap-3 border border-gray-700 text-gray-300 py-3 px-4 rounded-xl text-sm font-medium hover:border-gray-500 transition-colors text-left">
              <Download size={15} className="text-gray-500 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { logout(); navigate('/') }} className="flex items-center justify-center gap-2 w-full border border-gray-700 text-gray-400 py-4 rounded-xl hover:border-gray-500 hover:text-white transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
