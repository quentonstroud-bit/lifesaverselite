import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { CheckCircle, Lock } from 'lucide-react'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''

const POLICY_OPTIONS = ['Life Insurance', 'Health Insurance', 'Final Expense', 'Annuity', 'Medicare', 'Auto', 'Home', 'Other / Not sure']
const TIMELINE_OPTIONS = ['1 to 3 months', '3 to 6 months', '6 to 12 months', 'Just exploring options']

const INITIAL = {
  leadName: '', phone: '', email: '', city: '', state: '',
  age: '', beneficiaries: '', healthRating: 5, smoking: 'Non-Smoker',
  policyInterest: '', timeline: '', notes: '',
}

export default function LSSubmit() {
  const { user } = useAuth()
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const trainingDone = user?.trainingComplete

  if (!trainingDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Lock size={28} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold mb-3">Complete Training to Unlock</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          You must complete all 5 training modules before submitting referrals. This protects you, your leads, and your Agent/Broker.
        </p>
        <a href="/dashboard/lifesaver/training" className="bg-primary hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Start Training
        </a>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Referral Submitted!</h2>
        <p className="text-gray-400 text-sm mb-1">Pending STARS -- Rating coming soon</p>
        <p className="text-gray-500 text-xs mb-8">Your agent will review within 48 hours.</p>
        <button onClick={() => { setForm(INITIAL); setSubmitted(false) }}
          className="bg-primary hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Submit Another Referral
        </button>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { formType: 'referral_submit', lifesaverId: user?.id, lifesaverHandle: user?.handle, ...form }
      if (WEBAPP_URL !== 'PASTE_YOUR_WEBAPP_URL_HERE') {
        await fetch(WEBAPP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      setSubmitted(true)
    } catch {
      // silent for demo
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Submit a Referral</h1>
        <p className="text-gray-400 text-sm mt-1">All fields marked * are required.</p>
      </div>

      {/* Lead contact */}
      <Section title="Lead Contact Info">
        <Field label="Full Name" required>
          <input required type="text" placeholder="First and last name" value={form.leadName}
            onChange={e => setForm(p => ({ ...p, leadName: e.target.value }))} className={INPUT} />
        </Field>
        <Field label="Phone Number" required>
          <input required type="tel" placeholder="(555) 000-0000" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={INPUT} />
        </Field>
        <Field label="Email Address">
          <input type="email" placeholder="Optional" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={INPUT} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input type="text" placeholder="City" value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={INPUT} />
          </Field>
          <Field label="State">
            <input type="text" placeholder="TX" maxLength={2} value={form.state}
              onChange={e => setForm(p => ({ ...p, state: e.target.value.toUpperCase() }))} className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Lead profile */}
      <Section title="Lead Profile">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age" required>
            <input required type="number" min={18} max={90} placeholder="Age" value={form.age}
              onChange={e => setForm(p => ({ ...p, age: e.target.value }))} className={INPUT} />
          </Field>
          <Field label="Beneficiaries Listed">
            <input type="number" min={0} placeholder="0" value={form.beneficiaries}
              onChange={e => setForm(p => ({ ...p, beneficiaries: e.target.value }))} className={INPUT} />
          </Field>
        </div>

        <Field label={`Health Rating: ${form.healthRating}/10`} required>
          <input type="range" min={1} max={10} value={form.healthRating}
            onChange={e => setForm(p => ({ ...p, healthRating: Number(e.target.value) }))}
            className="w-full accent-red-600" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 (Poor)</span><span>5 (Average)</span><span>10 (Excellent)</span>
          </div>
        </Field>

        <Field label="Smoking Status" required>
          <div className="flex gap-2">
            {['Non-Smoker', 'Former Smoker', 'Smoker'].map(s => (
              <button key={s} type="button" onClick={() => setForm(p => ({ ...p, smoking: s }))}
                className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-semibold border transition-colors ${form.smoking === s ? 'bg-primary border-primary text-white' : 'bg-bg border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Policy details */}
      <Section title="Policy Details">
        <Field label="Policy Interest" required>
          <select required value={form.policyInterest} onChange={e => setForm(p => ({ ...p, policyInterest: e.target.value }))} className={SELECT}>
            <option value="">Select policy type</option>
            {POLICY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Purchase Timeline" required>
          <select required value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))} className={SELECT}>
            <option value="">Select timeline</option>
            {TIMELINE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea rows={4} placeholder="Notes help your rating. Share what you know about this lead's situation, urgency, or any context that might help the agent." value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
      </Section>

      <button type="submit" disabled={loading}
        className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors">
        {loading ? 'Submitting...' : 'Submit Referral'}
      </button>
    </form>
  )
}

const INPUT = 'w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary'
const SELECT = 'w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary'

function Section({ title, children }) {
  return (
    <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label} {required && <span className="text-primary">*</span>}</label>
      {children}
    </div>
  )
}
