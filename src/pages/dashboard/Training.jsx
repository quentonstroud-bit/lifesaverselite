import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle, Lock, Award, Download, ArrowLeft, X } from 'lucide-react'

const MODULES = [
  {
    id: 1, title: 'Onboarding', duration: '8 min',
    desc: 'Welcome to LifeSavers Elite. Learn who we are, what we do, and how you fit in.',
    takeaways: ['What LifeSavers Elite is and how the network operates', 'Your role as an Independent Contractor', 'What to expect in your first 30 days'],
  },
  {
    id: 2, title: 'Using the Platform', duration: '12 min',
    desc: 'A full walkthrough of your dashboard -- how to submit referrals, check your status, and track your earnings.',
    takeaways: ['How to navigate your dashboard tabs', 'Step-by-step referral submission walkthrough', 'How to read your referral status and star rating'],
  },
  {
    id: 3, title: 'Compensation', duration: '10 min',
    desc: 'Understand exactly how you get paid -- tiers, STARS, multipliers, and milestone bonuses.',
    takeaways: ['How base payouts are calculated per accepted lead', 'How the weekly multiplier works and when it activates', 'How STARS convert to milestone bonuses'],
  },
  {
    id: 4, title: 'Next Steps', duration: '6 min',
    desc: 'What to do right after completing training -- building your referral habit and connecting with your agent.',
    takeaways: ['How to contact and build a relationship with your assigned agent', 'Setting your first weekly referral goal', 'How to get help when you need it'],
  },
  {
    id: 5, title: 'Referral Training', duration: '15 min',
    desc: 'The most important module. Learn exactly what makes a great referral and how to get higher star ratings.',
    takeaways: ['How to have a natural conversation that surfaces insurance interest', 'What data points matter most for a high star rating', 'How to fill out the referral form for maximum score'],
  },
]

export default function Training() {
  const { user, completeTraining } = useAuth()
  const navigate = useNavigate()
  const [completed, setCompleted] = useState([])
  const [playing, setPlaying] = useState(null)
  const [showCert, setShowCert] = useState(false)

  const allDone = completed.length === MODULES.length

  function isUnlocked(moduleId) {
    if (moduleId === 1) return true
    return completed.includes(moduleId - 1)
  }

  function markComplete(id) {
    if (!completed.includes(id)) {
      const next = [...completed, id]
      setCompleted(next)
      if (next.length === MODULES.length) {
        completeTraining()
      }
    }
    setPlaying(null)
  }

  return (
    <div className="min-h-screen bg-bg text-white pb-10">
      <div className="max-w-xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard/lifesaver')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Training Modules</h1>
            <p className="text-gray-400 text-sm">{completed.length} of {MODULES.length} complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-surface rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completed.length / MODULES.length) * 100}%` }} />
        </div>

        {/* Modules */}
        <div className="flex flex-col gap-4 mb-8">
          {MODULES.map(({ id, title, duration, desc, takeaways }) => {
            const unlocked = isUnlocked(id)
            const done = completed.includes(id)
            return (
              <div key={id} className={`bg-surface border rounded-2xl overflow-hidden ${done ? 'border-success/30' : unlocked ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-success/20' : unlocked ? 'bg-primary/20' : 'bg-gray-800'}`}>
                        {done ? <CheckCircle size={18} className="text-success" /> : unlocked ? <span className="text-primary font-bold text-sm">{id}</span> : <Lock size={16} className="text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-bold">Module {String(id).padStart(2, '0')}: {title}</p>
                        <p className="text-gray-500 text-xs">{duration}</p>
                      </div>
                    </div>
                    {done && <span className="bg-success/20 text-success text-xs font-bold px-2 py-0.5 rounded-full">Complete</span>}
                    {!done && unlocked && <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Available</span>}
                    {!unlocked && <span className="bg-gray-800 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">Locked</span>}
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>

                  <div className="flex flex-col gap-1.5 mb-4">
                    {takeaways.map(t => (
                      <div key={t} className="flex items-start gap-2">
                        <CheckCircle size={13} className="text-gray-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-500">{t}</span>
                      </div>
                    ))}
                  </div>

                  {unlocked && !done && (
                    <button onClick={() => setPlaying(id)} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                      <Play size={15} /> Watch Module
                    </button>
                  )}
                  {done && (
                    <div className="flex items-center justify-center gap-2 text-success text-sm font-semibold py-2">
                      <CheckCircle size={15} /> Module Complete
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Certificate */}
        {allDone && (
          <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center">
            <Award size={40} className="text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Training Complete</h2>
            <p className="text-gray-400 text-sm mb-5">You are now a Certified LifeSavers Elite Partner. Your referral dashboard is unlocked.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCert(true)} className="flex-1 border border-success/40 text-success font-semibold py-3 rounded-xl text-sm hover:bg-success/10 transition-colors">
                View Certificate
              </button>
              <button onClick={() => navigate('/dashboard/lifesaver')} className="flex-1 bg-success hover:bg-green-600 text-black font-bold py-3 rounded-xl text-sm transition-colors">
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video player modal */}
      {playing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-gray-700 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <p className="font-bold text-sm">Module {String(playing).padStart(2, '0')}: {MODULES[playing - 1].title}</p>
              <button onClick={() => setPlaying(null)}><X size={18} className="text-gray-400" /></button>
            </div>

            {/* Video placeholder */}
            <div className="aspect-video bg-bg flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Play size={28} className="text-primary ml-1" />
              </div>
              <p className="text-gray-500 text-sm">{MODULES[playing - 1].duration} video</p>
              <p className="text-gray-600 text-xs">Video player will load here after setup</p>
            </div>

            {/* Scrub bar */}
            <div className="px-5 py-3">
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-800">
              <button onClick={() => markComplete(playing)} className="w-full bg-success/20 border border-success/30 text-success font-bold py-3.5 rounded-xl transition-colors hover:bg-success/30">
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate modal */}
      {showCert && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
          <div className="bg-surface border border-success/30 rounded-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Award size={32} className="text-success" />
            </div>
            <p className="text-xs font-bold text-success uppercase tracking-widest mb-2">Certificate of Completion</p>
            <h2 className="text-2xl font-extrabold mb-1">{user?.name || 'Certified Partner'}</h2>
            <p className="text-gray-400 text-sm mb-1">has successfully completed all training modules</p>
            <p className="text-gray-500 text-xs mb-6">LifeSavers Elite Partner Training - May 7, 2026</p>

            <div className="border-2 border-success/30 rounded-xl p-4 mb-6">
              <p className="text-success font-bold text-lg">Certified Partner</p>
              <p className="text-gray-500 text-xs mt-0.5">LifeSavers Elite Network</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCert(false)} className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-xl text-sm hover:border-gray-500 transition-colors">
                Close
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success font-semibold py-3 rounded-xl text-sm hover:bg-success/30 transition-colors">
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
