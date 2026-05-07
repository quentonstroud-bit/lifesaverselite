import React, { useState } from 'react'
import { MapPin, Clock, Zap, DollarSign, CheckCircle, ExternalLink } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const WEBAPP_URL = import.meta.env.VITE_WEBAPP_URL || ''
const CAL_URL = 'https://cal.com/quenton-stroud/30min'

const POSITIONS = ['Outreach Specialist', 'Educator / Community Ambassador', 'Referral Partner', 'Open to any']
const EMPLOYMENT_OPTIONS = ['Employed full-time', 'Employed part-time', 'Self-employed', 'Unemployed', 'Student', 'Retired']
const INSURANCE_OPTIONS = ['I have solid insurance knowledge', 'I have some basic knowledge', 'I have very little knowledge but I am willing to learn', 'I have no knowledge but I am eager to learn']
const REFERRAL_OPTIONS = ['Very comfortable', 'Somewhat comfortable', 'A little hesitant but open', 'Not sure yet']

const INITIAL = {
  name: '', email: '', phone: '', facebook: '',
  positions: [], employment: '', insurance: '', referral: '', excites: '',
  resumeFile: null, agreed: false,
}

export default function Apply() {
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function togglePosition(pos) {
    setForm(p => ({
      ...p,
      positions: p.positions.includes(pos)
        ? p.positions.filter(x => x !== pos)
        : [...p.positions, pos],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.agreed) { setError('Please accept the legal disclaimer to continue.'); return }
    setLoading(true)
    setError('')

    try {
      const payload = {
        formType: 'application',
        name: form.name, email: form.email, phone: form.phone,
        facebook: form.facebook, positions: form.positions.join(', '),
        employment: form.employment, insurance: form.insurance,
        referral: form.referral, excites: form.excites,
        resumeAttached: form.resumeFile ? 'Yes' : 'No',
      }

      if (WEBAPP_URL !== 'PASTE_YOUR_WEBAPP_URL_HERE') {
        await fetch(WEBAPP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setSubmitted(true)
    } catch {
      setError('Submission failed. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Application Received</h1>
          <p className="text-gray-400 mb-2">Now Book Your First Interview</p>
          <p className="text-gray-500 text-sm mb-8">
            Booking your interview moves your application to priority review.
          </p>
          <a
            href={CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
          >
            Schedule My First Interview <ExternalLink size={16} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Nav />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[
              { icon: MapPin, text: 'Remote' },
              { icon: Clock, text: 'Flexible Hours' },
              { icon: Zap, text: 'Performance-Based' },
              { icon: DollarSign, text: 'Weekly Payouts' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 bg-surface border border-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full">
                <Icon size={12} className="text-primary" /> {text}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-center mb-4">Join LifeSavers Elite</h1>
          <p className="text-gray-400 text-center mb-10 leading-relaxed max-w-xl mx-auto">
            LifeSavers Elite connects everyday people with insurance professionals. Your job is simple: educate, inspire, and refer. No prior experience required. No selling. No MLM.
          </p>

          <form onSubmit={handleSubmit} className="bg-surface border border-gray-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6">

            {/* Contact info */}
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith', required: true },
                  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@email.com', required: true },
                  { name: 'phone', label: 'Telephone Number', type: 'tel', placeholder: '(555) 000-0000', required: true },
                  { name: 'facebook', label: 'Facebook Profile Link', type: 'url', placeholder: 'https://facebook.com/yourname', required: true },
                ].map(({ name, label, type, placeholder, required }) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-300">{label} {required && <span className="text-primary">*</span>}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      required={required}
                      value={form[name]}
                      onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                      className="bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Positions */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">Position(s) Interested In <span className="text-primary">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POSITIONS.map(pos => (
                  <label key={pos} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${form.positions.includes(pos) ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                    <input type="checkbox" checked={form.positions.includes(pos)} onChange={() => togglePosition(pos)} className="accent-red-600" />
                    <span className="text-sm">{pos}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Employment status */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Current Employment Status <span className="text-primary">*</span></label>
              <select
                required
                value={form.employment}
                onChange={e => setForm(p => ({ ...p, employment: e.target.value }))}
                className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select status</option>
                {EMPLOYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Insurance knowledge */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">Your Insurance Knowledge <span className="text-primary">*</span></label>
              <div className="flex flex-col gap-2">
                {INSURANCE_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${form.insurance === opt ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                    <input type="radio" name="insurance" value={opt} checked={form.insurance === opt} onChange={e => setForm(p => ({ ...p, insurance: e.target.value }))} className="accent-red-600" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Referral comfort */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">Comfort Level Referring People <span className="text-primary">*</span></label>
              <div className="flex flex-col gap-2">
                {REFERRAL_OPTIONS.map(opt => (
                  <label key={opt} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${form.referral === opt ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-gray-500'}`}>
                    <input type="radio" name="referral" value={opt} checked={form.referral === opt} onChange={e => setForm(p => ({ ...p, referral: e.target.value }))} className="accent-red-600" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Excites */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">What excites you most about this opportunity? <span className="text-primary">*</span></label>
              <textarea
                required
                rows={4}
                value={form.excites}
                onChange={e => setForm(p => ({ ...p, excites: e.target.value }))}
                placeholder="Tell us in your own words..."
                className="w-full bg-bg border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Resume upload */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Resume (optional -- PDF or DOC)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setForm(p => ({ ...p, resumeFile: e.target.files[0] || null }))}
                className="w-full bg-bg border border-gray-700 text-gray-400 rounded-lg px-4 py-3 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-white file:text-xs file:font-semibold"
              />
            </div>

            {/* Legal disclaimer */}
            <div className="bg-bg border border-gray-700 rounded-xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.agreed}
                  onChange={e => setForm(p => ({ ...p, agreed: e.target.checked }))}
                  className="accent-red-600 mt-1 flex-shrink-0"
                />
                <span className="text-xs text-gray-400 leading-relaxed">
                  I understand and agree that I am applying as an Independent Contractor (IC), not an employee of LifeSavers Elite or any affiliated agency. I am responsible for filing my own taxes. I acknowledge this is a performance-based role with no guaranteed income. My information will be handled in accordance with the Taylored4U Wealth Strategies privacy statement. <span className="text-primary">*</span>
                </span>
              </label>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
