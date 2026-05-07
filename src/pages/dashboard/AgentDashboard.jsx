import React, { useState } from 'react'
import { Inbox, BarChart2, Globe, Users, Settings } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import AgentLeads from './agent/AgentLeads'
import AgentSpend from './agent/AgentSpend'
import AgentPool from './agent/AgentPool'
import AgentLifeSavers from './agent/AgentLifeSavers'
import AgentSettings from './agent/AgentSettings'

const TABS = [
  { key: 'leads', label: 'Leads', icon: Inbox },
  { key: 'spend', label: 'Spend', icon: BarChart2 },
  { key: 'pool', label: 'Pool', icon: Globe },
  { key: 'lifesavers', label: 'LifeSavers', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState('leads')

  const content = {
    leads: <AgentLeads />,
    spend: <AgentSpend />,
    pool: <AgentPool />,
    lifesavers: <AgentLifeSavers />,
    settings: <AgentSettings />,
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      <div className="max-w-xl mx-auto px-4 pt-6">
        {content[activeTab]}
      </div>
      <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
