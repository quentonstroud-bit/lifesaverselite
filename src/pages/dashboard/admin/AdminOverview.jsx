import React, { useState, useEffect } from 'react'
import { AlertTriangle, Users, Building2, List, Globe } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''
const WEEKLY_TARGET = 200

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!WEBAPP_URL) { setLoading(false); return }
    fetch(WEBAPP_URL + '?query=dashboard_stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const ls = stats?.lsCount ?? '—'
  const ag = stats?.agCount ?? '—'
  const leads = stats?.leadsThisWeek ?? '—'
  const pool = stats?.inPool ?? '—'
  const revenue = stats ? stats.weeklyRevenue.toFixed(2) : '—'
  const pct = stats ? Math.min(100, Math.round((stats.weeklyRevenue / WEEKLY_TARGET) * 100)) : 0

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, Quenton</p>
        </div>
        <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">Super Admin</span>
      </div>

      {/* Network stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Active LifeSavers', value: ls },
          { icon: Building2, label: 'Active Agents', value: ag },
          { icon: List, label: 'Leads This Week', value: leads },
          { icon: Globe, label: 'In General Pool', value: pool },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className="text-gray-500" />
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
            <p className="text-2xl font-extrabold">{loading ? '…' : value}</p>
          </div>
        ))}
      </div>

      {/* Weekly revenue */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">Weekly Revenue</p>
          <p className="text-xs text-gray-500">Target: ${WEEKLY_TARGET}</p>
        </div>
        <p className="text-3xl font-extrabold text-success mb-3">{loading ? '…' : `$${revenue}`}</p>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{loading ? '—' : `${pct}% of weekly target`}</p>
      </div>

      {/* Alerts */}
      <div>
        <p className="text-sm font-bold mb-3">Active Alerts</p>
        {stats && stats.inPool > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 border bg-warning/10 border-warning/30">
              <AlertTriangle size={15} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">{stats.inPool} lead{stats.inPool !== 1 ? 's' : ''} in the General Pool</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{loading ? 'Loading…' : 'No active alerts.'}</p>
        )}
      </div>
    </div>
  )
}
