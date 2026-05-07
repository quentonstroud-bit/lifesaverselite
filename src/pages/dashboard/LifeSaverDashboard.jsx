import React, { useState } from 'react'
import { Home, Send, List, DollarSign, Star, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import ICAgreementModal from '../../components/ICAgreementModal'
import LSHome from './lifesaver/LSHome'
import LSSubmit from './lifesaver/LSSubmit'
import LSReferrals from './lifesaver/LSReferrals'
import LSEarnings from './lifesaver/LSEarnings'
import LSStars from './lifesaver/LSStars'
import LSProfile from './lifesaver/LSProfile'

const TABS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'submit', label: 'Submit', icon: Send },
  { key: 'referrals', label: 'Referrals', icon: List },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'stars', label: 'Stars', icon: Star },
  { key: 'profile', label: 'Profile', icon: User },
]

export default function LifeSaverDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('home')

  const showICModal = user && !user.icSigned

  const content = {
    home: <LSHome />,
    submit: <LSSubmit />,
    referrals: <LSReferrals />,
    earnings: <LSEarnings />,
    stars: <LSStars />,
    profile: <LSProfile />,
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-20">
      {showICModal && <ICAgreementModal agentName="your assigned Agent/Broker" />}
      <div className="max-w-xl mx-auto px-4 pt-6">
        {content[activeTab]}
      </div>
      <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
