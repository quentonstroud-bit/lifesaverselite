import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { CheckCircle, Lock } from 'lucide-react'
import StarRating from '../../../components/StarRating'
import { scoreLead, HEALTH_CONDITIONS, NONE_OF_THESE, RELATIONSHIPS, MAX_BENEFICIARY_ROWS, POLICY_TYPES, TIMELINES, US_STATES } from '../../../lib/leadScore'
import { apiPost } from '../../../lib/api'



const INITIAL = {
  firstName: '', lastName: '', phone: '', email: '', city: '', state: '',
  age: '', beneficiaries: '', beneficiaryDetails: [],
  healthRating: 5, healthConditions: [], smoking: 'Non-Smoker',
  policyInterest: '', timeline: '', notes: '',
}

const NOTES_TARGET = 150

export default function LSSubmit() {
  const { user } = useAuth()
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        <p className="text-gray-400 text-sm mb-1">Your referral is rated automatically from the details you submitted</p>
        <p className="text-gray-500 text-xs mb-8">Your agent will review within 48 hours.</p>
        <button onClick={() => { setForm(INITIAL); setSubmitted(false) }}
          className="bg-primary hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
          Submit Another Referral
        </button>
      </div>
    )
  }

  const rowCount = Math.min(parseInt(form.beneficiaries, 10) || 0, MAX_BENEFICIARY_ROWS)

  function setBeneficiary(i, patch) {
    setForm(p => {
      const rows = Array.from({ length: Math.max(p.beneficiaryDetails.length, i + 1) }, (_, k) => p.beneficiaryDetails[k] || { name: '', relationship: '' })
      rows[i] = { ...rows[i], ...patch }
      return { ...p, beneficiaryDetails: rows }
    })
  }

  function toggleCondition(c) {
    setForm(p => {
      const has = p.healthConditions.includes(c)
      if (c === NONE_OF_THESE) return { ...p, healthConditions: has ? [] : [NONE_OF_THESE] }
      const without = p.healthConditions.filter(x => x !== NONE_OF_THESE && x !== c)
      return { ...p, healthConditions: has ? without : [...without, c] }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Identity (who is submitting) is taken from your signed-in session on the server.
      await apiPost('referral_submit', { ...form, beneficiaryDetails: form.beneficiaryDetails.slice(0, rowCount) })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Could not submit. Please try again.')
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

      {/* Live lead-quality meter */}
      <QualityMeter form={form} />

      {/* Lead contact */}
      <Section title="Lead Contact Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" required>
            <input required type="text" autoComplete="off" placeholder="First name" maxLength={40} value={form.firstName}
              onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className={INPUT} />
          </Field>
          <Field label="Last Name" required>
            <input required type="text" autoComplete="off" placeholder="Last name" maxLength={40} value={form.lastName}
              onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className={INPUT} />
          </Field>
        </div>
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
            <select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className={SELECT}>
              <option value="">Select</option>
              {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
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
            <input type="number" min={0} max={10} placeholder="0" value={form.beneficiaries}
              onChange={e => setForm(p => ({ ...p, beneficiaries: e.target.value }))} className={INPUT} />
          </Field>
        </div>

        {rowCount > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-500">Name each beneficiary and how they are related to the lead.{parseInt(form.beneficiaries, 10) > MAX_BENEFICIARY_ROWS && ` List up to ${MAX_BENEFICIARY_ROWS}.`}</p>
            {Array.from({ length: rowCount }, (_, i) => {
              const row = form.beneficiaryDetails[i] || { name: '', relationship: '' }
              return (
                <div key={i} className="grid grid-cols-5 gap-2">
                  <input type="text" aria-label={`Beneficiary ${i + 1} name`} placeholder={`Beneficiary ${i + 1} name`} maxLength={60} value={row.name}
                    onChange={e => setBeneficiary(i, { name: e.target.value })} className={`${INPUT} col-span-3`} />
                  <select aria-label={`Beneficiary ${i + 1} relationship`} value={row.relationship}
                    onChange={e => setBeneficiary(i, { relationship: e.target.value })} className={`${SELECT} col-span-2`}>
                    <option value="">Relationship</option>
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Health */}
      <Section title="Health">
        <Field label={`Health Rating: ${form.healthRating}/10`} required>
          <input type="range" min={1} max={10} value={form.healthRating}
            onChange={e => setForm(p => ({ ...p, healthRating: Number(e.target.value) }))}
            className="w-full accent-red-600" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 (Poor)</span><span>5 (Average)</span><span>10 (Excellent)</span>
          </div>
        </Field>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-300">Any of these health challenges? <span className="text-gray-500 font-normal">Check all that apply</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...HEALTH_CONDITIONS, NONE_OF_THESE].map(c => {
              const on = form.healthConditions.includes(c)
              return (
                <label key={c} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${on ? 'bg-primary/15 border-primary text-white' : 'bg-bg border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleCondition(c)} className="accent-red-600 w-4 h-4 flex-shrink-0" />
                  <span>{c}</span>
                </label>
              )
            })}
          </div>
          <p className="text-xs text-gray-500">Not sure? Leave it blank. Choose "None of these" only if you asked and none apply.</p>
        </div>

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
        <Field label="Policy Type" required>
          <select required value={form.policyInterest} onChange={e => setForm(p => ({ ...p, policyInterest: e.target.value }))} className={SELECT}>
            <option value="">Select policy type</option>
            {POLICY_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Purchase Timeline" required>
          <select required value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))} className={SELECT}>
            <option value="">Select timeline</option>
            {TIMELINES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <textarea rows={4} placeholder="Notes help your rating. Share what you know about this lead's situation, urgency, or any context that might help the agent." value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
        <p className={`text-xs ${form.notes.trim().length >= NOTES_TARGET ? 'text-success' : 'text-gray-500'}`}>
          {form.notes.trim().length} characters{form.notes.trim().length >= NOTES_TARGET ? ': full credit for notes' : `. Write at least ${NOTES_TARGET} for full credit.`}
        </p>
      </Section>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <button type="submit" disabled={loading}
        className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors">
        {loading ? 'Submitting...' : 'Submit Referral'}
      </button>
    </form>
  )
}

function QualityMeter({ form }) {
  const { score, stars, tips } = scoreLead(form)
  const bar = stars >= 4 ? 'bg-success' : stars === 3 ? 'bg-warning' : 'bg-red-500'
  return (
    <div className="sticky top-2 z-10 bg-surface border border-gray-700 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lead quality</p>
          <p className="text-sm font-semibold">{stars >= 4 ? 'Strong lead' : stars === 3 ? 'Getting there' : 'Needs more detail'}</p>
        </div>
        <StarRating rating={stars} size={20} />
      </div>
      <div className="h-2 bg-bg rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${bar}`} style={{ width: `${score}%` }} />
      </div>
      {tips.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          To raise it: {tips.map(t => t.tip.toLowerCase()).join('; ')}.
        </p>
      )}
      <p className="text-xs text-gray-600 mt-1">The more questions you answer well, the higher the rating. Final rating is set when you submit.</p>
    </div>
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
