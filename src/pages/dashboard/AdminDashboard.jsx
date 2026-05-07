import React, { useState } from 'react'
import { LayoutDashboard, List, Users, Building2, TrendingUp, Settings } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import AdminOverview from './admin/AdminOverview'
import AdminLeads from './admin/AdminLeads'
import AdminLifeSavers from './admin/AdminLifeSavers'
import AdminAgents from './admin/AdminAgents'
import AdminRevenue from './admin/AdminRevenue'
import AdminSettings from './admin/AdminSettings'

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'leads', label: 'Leads', icon: List },
  { key: 'lifesavers', label: 'LifeSavers', icon: Users },
  { key: 'agents', label: 'Agents', icon: Building2 },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const content = {
    overview: <AdminOverview />,
    leads: <AdminLeads />,
    lifesavers: <AdminLifeSavers />,
    agents: <AdminAgents />,
    revenue: <AdminRevenue />,
    settings: <AdminSettings />,
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {content[activeTab]}
      </div>
      <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
