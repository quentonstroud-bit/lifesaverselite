import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ExternalLink, ShieldCheck } from 'lucide-react'

const CAL_URL = 'https://cal.com/quenton-stroud/30min'

export default function ICAgreementModal({ agentName = 'your assigned Agent/Broker' }) {
  const { signIcAgreement } = useAuth()
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [declined, setDeclined] = useState(false)

  function handleAccept() {
    if (!agreed) return
    signIcAgreement()
  }

  if (declined) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
        <div className="bg-surface border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-3">No Problem</h2>
          <p className="text-gray-400 text-sm mb-8">
            Book a call to learn more before committing. We are happy to answer any questions.
          </p>
          <a href={CAL_URL} target="_blank" rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white font-semibold py-4 rounded-xl transition-colors mb-4">
            Schedule My First Interview <ExternalLink size={16} />
          </a>
          <button onClick={() => setDeclined(false)} className="w-full border border-gray-700 text-gray-300 py-3 rounded-xl text-sm hover:border-gray-500 transition-colors">
            Go Back and Review Agreement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-surface border border-gray-700 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={24} className="text-primary" />
          <h2 className="text-xl font-bold">Independent Contractor Agreement</h2>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Before accessing your dashboard, please review and accept the following agreement. This is required to participate in the LifeSavers Elite network.
        </p>

        {/* Part 1 */}
        <div className="bg-bg border border-gray-800 rounded-xl p-5 mb-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Part 1 -- LifeSavers Elite Agreement</p>
          <div className="flex flex-col gap-3 text-sm text-gray-300 leading-relaxed">
            <p>You are engaging with LifeSavers Elite as an Independent Contractor (IC). You are not an employee of LifeSavers Elite or any affiliated entity. You are responsible for your own taxes, expenses, and compliance.</p>
            <p><strong className="text-white">Confidentiality (NDA):</strong> You agree to keep all LifeSavers Elite systems, methodology, compensation structures, platform features, and business information strictly confidential. This obligation continues after your participation ends.</p>
            <p><strong className="text-white">Non-Compete:</strong> For 24 months following the end of your participation, you agree not to operate, promote, or participate in any competing referral or lead generation platform targeting insurance professionals.</p>
          </div>
        </div>

        {/* Part 2 */}
        <div className="bg-bg border border-gray-800 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold text-warning uppercase tracking-wider mb-3">Part 2 -- Agreement with Your Retaining Agent/Broker</p>
          <p className="text-sm text-gray-400 mb-3">Your assigned Agent/Broker: <strong className="text-white">{agentName}</strong></p>
          <div className="flex flex-col gap-3 text-sm text-gray-300 leading-relaxed">
            <p>Your compensation is the sole responsibility of your retaining Agent/Broker. LifeSavers Elite makes no guarantees regarding the timing, amount, or payment of your referral earnings.</p>
            <p>You are an Independent Contractor of LifeSavers Elite. You are not an employee, subcontractor, or representative of {agentName}. No employment relationship is created by this agreement.</p>
            <p>All client interactions, regulatory requirements, and licensing obligations related to referred leads are the exclusive responsibility of {agentName}.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-red-600 mt-1 flex-shrink-0" />
          <span className="text-sm text-gray-300">
            I have read, understood, and agree to both Part 1 and Part 2 of this Independent Contractor Agreement.
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setDeclined(true)} className="flex-1 border border-gray-700 text-gray-400 py-3 rounded-xl text-sm font-medium hover:border-gray-500 transition-colors">
            Decline
          </button>
          <button onClick={handleAccept} disabled={!agreed}
            className="flex-1 bg-primary hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors">
            Accept Agreement
          </button>
        </div>
      </div>
    </div>
  )
}
