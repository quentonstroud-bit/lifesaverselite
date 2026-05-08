import React, { useState } from 'react'
import { CheckCircle, ExternalLink, Upload, ChevronRight } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''
const CAL_URL = 'https://cal.com/quenton-stroud/30min'

const LINES = ['Life', 'Health', 'Auto', 'Home', 'Annuities', 'Final Expense', 'Medicare', 'Other']
const YEARS_OPTIONS = ['Less than 1 year', '1 to 3 years', '3 to 5 years', '5 to 10 years', '10+ years']
const HEAR_OPTIONS = ['Google Search', 'Social Media', 'Referral from a colleague', 'Email', 'Industry event', 'Other']
const PAYOUT_OPTIONS = ['Direct deposit (ACH)', 'Zelle', 'PayPal', 'Venmo', 'CashApp', 'Wise', 'Other']

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const INITIAL = {
  name: '', agency: '', email: '', phone: '',
  license: '', states: [], years: '',
  lines: [],
  payoutStructure: 'standard',
  hearAbout: '',
  paymentMethod: '',
  agreed: false,
}

export default function AgentEnroll() {
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showContract, setShowContract] = useState(false)

  function toggleLine(line) {
    setForm(p => ({
      ...p,
      lines: p.lines.includes(line) ? p.lines.filter(x => x !== line) : [...p.lines, line],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.agreed) return
    setLoading(true)
    try {
      const payload = { formType: 'agent_enrollment', ...form, lines: form.lines.join(', '), states: form.states.join(', ') }
      await fetch(WEBAPP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } catch {
      // proceed regardless — data sent best-effort
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to the Network</h1>
          <p className="text-gray-400 mb-2">Your application has been received.</p>
          <div className="bg-surface border border-gray-800 rounded-xl p-6 text-left mb-8">
            <p className="text-sm font-bold mb-4">Next Steps</p>
            <div className="flex flex-col gap-3">
              {['Your application is under review (24 to 48 hours)', 'You will receive login credentials by email once approved', 'Book your onboarding call to get set up quickly'].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-primary rounded-full text-xs text-white flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-sm text-gray-300">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Book My Onboarding Call <ExternalLink size={16} />
          </a>
          <p className="text-gray-500 text-xs mt-6">Sincerely, Quenton Stroud, Executive Manager, LifeSavers Elite</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Nav />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Page 1 -- Landing */}
          {page === 1 && (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold mb-4">Your Next Referral Pipeline<br />is Already Built.</h1>
                <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
                  Our network of trained LifeSavers submits warm, pre-qualified referrals directly to your queue. You review, accept, and connect.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                  {[
                    { stat: '4,200+', label: 'Active LifeSavers' },
                    { stat: '$2', label: 'Per accepted lead' },
                    { stat: '48hr', label: 'Response window' },
                  ].map(({ stat, label }) => (
                    <div key={label} className="bg-surface border border-gray-800 rounded-xl py-6 px-4 text-center">
                      <p className="text-3xl font-extrabold text-primary">{stat}</p>
                      <p className="text-gray-400 text-sm mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-surface border border-gray-800 rounded-2xl p-8 text-left mb-8">
                  <h2 className="font-bold text-lg mb-6">How It Works for Agents</h2>
                  <div className="flex flex-col gap-4">
                    {[
                      'A LifeSaver submits a referral with lead details and notes',
                      'You receive an alert and review the lead profile within 48 hours',
                      'Accept to unlock contact info and pay the $2 service fee',
                      'Decline to return the lead to the General Pool at no charge',
                      'Payouts to your assigned LifeSavers are processed every Sunday',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-primary rounded-full text-xs text-white flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => setPage(2)} className="bg-primary hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Enroll as Agent/Broker <ChevronRight size={18} />
                  </button>
                  <a href={CAL_URL} target="_blank" rel="noopener noreferrer" className="border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Schedule a Call <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Page 2 -- Application form */}
          {page === 2 && (
            <form onSubmit={e => { e.preventDefault(); setShowContract(true) }} className="bg-surface border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
              <h1 className="text-2xl font-bold">Agent/Broker Application</h1>

              {/* Contact */}
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'name', label: 'Full Name', type: 'text' },
                    { name: 'agency', label: 'Agency / Company Name', type: 'text' },
                    { name: 'email', label: 'Email Address', type: 'email' },
                    { name: 'phone', label: 'Phone Number', type: 'tel' },
                    { name: 'license', label: 'NPN (National Producer Number)', type: 'text' },
                  ].map(({ name, label, type }) => (
                    <div key={name} className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-300">{label} <span className="text-primary">*</span></label>
                      <input type={type} required value={form[name]}
                        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                        className="bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                </div>
              </div>

              {/* States licensed */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">State(s) Licensed <span className="text-primary">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {US_STATES.map(s => (
                    <label key={s} className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${form.states.includes(s) ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={form.states.includes(s)}
                        onChange={() => setForm(p => ({ ...p, states: p.states.includes(s) ? p.states.filter(x => x !== s) : [...p.states, s] }))}
                        className="accent-red-600" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* Years */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Years in Practice <span className="text-primary">*</span></label>
                <select required value={form.years} onChange={e => setForm(p => ({ ...p, years: e.target.value }))}
                  className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary">
                  <option value="">Select</option>
                  {YEARS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Lines of business */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">Lines of Business <span className="text-primary">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LINES.map(line => (
                    <label key={line} className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${form.lines.includes(line) ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                      <input type="checkbox" checked={form.lines.includes(line)} onChange={() => toggleLine(line)} className="accent-red-600" />
                      {line}
                    </label>
                  ))}
                </div>
              </div>

              {/* Service fee acknowledgment */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
                <p className="font-bold text-sm mb-1">Service Fee Acknowledgment</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  <strong>$2.00 per accepted lead.</strong> No monthly fees. No minimums. You are only charged when you accept a lead and unlock contact information.
                </p>
              </div>

              {/* Payout structure */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">LifeSaver Payout Structure</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'standard', label: 'Accept standard payout structure' },
                    { value: 'custom', label: 'I would like to discuss a custom structure' },
                  ].map(({ value, label }) => (
                    <label key={value} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${form.payoutStructure === value ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                      <input type="radio" name="payout" value={value} checked={form.payoutStructure === value} onChange={e => setForm(p => ({ ...p, payoutStructure: e.target.value }))} className="accent-red-600" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* How heard + payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">How did you hear about us?</label>
                  <select value={form.hearAbout} onChange={e => setForm(p => ({ ...p, hearAbout: e.target.value }))}
                    className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary">
                    <option value="">Select</option>
                    {HEAR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Preferred Payout Method <span className="text-primary">*</span></label>
                  <select required value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary">
                    <option value="">Select</option>
                    {PAYOUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                Review and Sign Agreement <ChevronRight size={18} />
              </button>
            </form>
          )}

          {/* Contract modal */}
          {showContract && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
              <div className="bg-surface border-t border-gray-700 rounded-t-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-2">Agent/Broker Platform Agreement</h2>
                <p className="text-gray-400 text-sm mb-6">Please read the full agreement before signing.</p>

                <div className="text-sm text-gray-300 leading-loose flex flex-col gap-4 mb-8">
                  {[
                    'LifeSavers Elite provides a lead referral platform connecting trained LifeSavers with licensed Agent/Brokers.',
                    'The service fee is $2.00 per accepted lead. This fee is charged when you unlock a lead\'s contact information.',
                    'You have 48 hours to act on each lead. Leads not acted on within this window are automatically released to the General Pool.',
                    'LifeSaver compensation is 100% the responsibility of the retaining Agent/Broker. LifeSavers Elite makes no compensation guarantees.',
                    'LifeSavers are Independent Contractors of LifeSavers Elite. They are not employees of your agency or brokerage.',
                    'All client interactions and regulatory compliance are the Agent/Broker\'s sole responsibility.',
                    'Both parties agree to maintain confidentiality of platform systems, methodology, and proprietary information (NDA).',
                    'You agree not to operate a competing referral or lead generation platform within 24 months of separation.',
                    'Either party may terminate this agreement with 30 days written notice.',
                  ].map((clause, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{clause}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input type="checkbox" checked={form.agreed} onChange={e => setForm(p => ({ ...p, agreed: e.target.checked }))} className="accent-red-600 mt-1 flex-shrink-0" />
                  <span className="text-sm text-gray-300">I have read and agree to all terms of this Agent/Broker Platform Agreement.</span>
                </label>

                <div className="flex gap-3">
                  <button onClick={() => setShowContract(false)} className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-xl text-sm font-medium hover:border-gray-500 transition-colors">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.agreed || loading}
                    className="flex-1 bg-primary hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Sign and Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
