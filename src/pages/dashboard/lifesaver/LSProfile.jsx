import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, BookOpen, Download, LogOut, Bell, CreditCard } from 'lucide-react'
import { apiGet } from '../../../lib/api'
import PasswordCard from '../../../components/PasswordCard'

export default function LSProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => { apiGet('ls_data').then(setData).catch(() => {}) }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const submitted = data?.totalSubmitted ?? 0
  const rate = submitted ? Math.round(((data?.totalAccepted ?? 0) / submitted) * 100) : 0
  const stats = [
    { label: 'Total Earned', value: data ? `$${(data.totalEarned ?? 0).toFixed(2)}` : '...' },
    { label: 'Referrals Submitted', value: data ? submitted : '...' },
    { label: 'Acceptance Rate', value: data ? `${rate}%` : '...' },
    { label: 'Qualifying Leads (2+ stars)', value: data ? (data.qualifiedLeads ?? 0) : '...' },
  ]

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Identity card */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-bold text-xl">{user?.name?.[0] || 'J'}</span>
        </div>
        <div>
          <p className="font-bold text-lg">{user?.name}</p>
          <p className="text-gray-400 text-sm">{user?.handle}</p>
          <span className="inline-block mt-1.5 bg-warning/20 border border-warning/30 text-warning text-xs font-bold px-2 py-0.5 rounded-full">
            {user?.tier === 'Pending Activation' ? 'Pending Activation' : (data?.isSupreme ? 'Supreme' : (data?.level || 'Supporter'))}
          </span>
        </div>
      </div>

      {/* Assigned agent */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assigned Agent/Broker</p>
        <p className="font-semibold">{user?.agentEmail || 'Being assigned'}</p>
        {!user?.agentEmail && <p className="text-gray-400 text-sm">Your agent will be assigned after approval.</p>}
      </div>

      {/* IC + Training status */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.icSigned ? <CheckCircle size={16} className="text-success" /> : <Clock size={16} className="text-warning" />}
            <span className="text-sm">IC Agreement</span>
          </div>
          <span className={`text-xs font-bold ${user?.icSigned ? 'text-success' : 'text-warning'}`}>
            {user?.icSigned ? 'Confirmed' : 'Pending'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.trainingComplete ? <CheckCircle size={16} className="text-success" /> : <Clock size={16} className="text-warning" />}
            <span className="text-sm">Training Certificate</span>
          </div>
          {user?.trainingComplete
            ? <button className="flex items-center gap-1.5 text-xs text-primary font-semibold"><Download size={12} /> Download</button>
            : <button onClick={() => navigate('/dashboard/lifesaver/training')} className="text-xs text-primary font-semibold">Start Training</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Settings links */}
      <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden">
        {[
          { icon: Bell, label: 'Notification Settings' },
          { icon: CreditCard, label: 'Payment Info' },
          { icon: BookOpen, label: 'View IC Agreement' },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-bg/50 transition-colors text-left">
            <Icon size={17} className="text-gray-500" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      <PasswordCard />

      <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full border border-gray-700 text-gray-400 py-4 rounded-xl hover:border-gray-500 hover:text-white transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
