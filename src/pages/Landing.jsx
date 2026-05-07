import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, CheckCircle, Star, ArrowRight, Users, DollarSign, TrendingUp } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const TIERS = [
  { name: 'Star 1', stars: 1 },
  { name: 'Star 2', stars: 2 },
  { name: 'Star 3', stars: 3, badge: 'Most Earned' },
  { name: 'Star 4', stars: 4, badge: 'Most Earned' },
  { name: 'Star 5 Elite', stars: 5, badge: 'Highest Payout' },
]

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-4 h-4 ${filled ? 'fill-warning text-warning' : 'fill-gray-700 text-gray-700'}`}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', carrier: '' })

  function handleQuickApply(e) {
    e.preventDefault()
    navigate('/apply', { state: form })
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Nav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-bg via-surface to-bg opacity-90" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(204,0,0,0.12) 0%, transparent 60%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-block bg-primary/20 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            Referral Network Platform
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Turn Your Connections<br />
            <span className="text-primary">into Cash.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            You know the right people. Now get paid to tell them about us.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/apply" className="bg-primary hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              Apply to Join
            </Link>
            <a href="#how-it-works" className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors w-full sm:w-auto text-center">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary py-6 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Users, stat: '4,200+', label: 'Agents in Network' },
            { icon: DollarSign, stat: '$1.8M+', label: 'Referrals Paid Out' },
            { icon: TrendingUp, stat: '$1,340', label: 'Avg Monthly Bonus' },
          ].map(({ icon: Icon, stat, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={22} className="text-white/80" />
              <p className="text-2xl font-extrabold text-white">{stat}</p>
              <p className="text-white/80 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">Three simple steps between you and your first payout.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Refer a Lead', desc: 'Share a quick form with someone who might need insurance coverage. Takes under 2 minutes.' },
              { step: '02', title: 'Lead Gets Contacted', desc: 'A licensed agent reaches out within 48 hours. You do nothing else.' },
              { step: '03', title: 'You Get Paid', desc: 'When your lead is accepted, your earnings are logged. Payouts go out every week.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-surface border border-gray-800 rounded-2xl p-8 flex flex-col gap-4">
                <span className="text-primary font-extrabold text-4xl opacity-60">{step}</span>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earn / Tiers */}
      <section id="earn" className="py-20 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">What You Can Earn</h2>
          <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">
            Five earning tiers. The more quality referrals you submit, the higher you climb.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {TIERS.map(({ name, stars, badge }) => (
              <div key={name} className={`relative bg-bg border rounded-2xl p-6 flex flex-col items-center gap-3 ${badge === 'Highest Payout' ? 'border-warning' : badge === 'Most Earned' ? 'border-primary' : 'border-gray-800'}`}>
                {badge && (
                  <span className={`absolute -top-3 text-xs font-bold px-2 py-0.5 rounded-full ${badge === 'Highest Payout' ? 'bg-warning text-black' : 'bg-primary text-white'}`}>
                    {badge}
                  </span>
                )}
                <p className="font-bold text-sm">{name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < stars} />)}
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Lock size={14} />
                  <span>Apply to unlock</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
            <p className="text-xl font-bold mb-2">Find Out What Your Network Is Worth.</p>
            <p className="text-gray-400 mb-6">Your payout tier is calculated after your first approved referrals. Apply to get started.</p>
            <Link to="/apply" className="inline-block bg-primary hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Why LifeSavers Elite */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-14">Why LifeSavers Elite</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              'No cold calls',
              'No selling required',
              'Real-time lead tracking',
              'Weekly payouts',
              'Mobile-friendly dashboard',
              'Unlimited earning potential',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 bg-surface border border-gray-800 rounded-xl px-6 py-4">
                <CheckCircle size={20} className="text-success flex-shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-primary py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Get Paid for Who You Know?</h2>
          <p className="text-white/80 mb-10">Fill in your info below and we will reach out within 24 hours.</p>

          <form onSubmit={handleQuickApply} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 sm:p-8 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
              { name: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@email.com' },
              { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '(555) 000-0000' },
              { name: 'carrier', label: 'Current Carrier', type: 'text', placeholder: 'e.g. State Farm, Allstate' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-white text-sm font-medium">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                  className="bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <button type="submit" className="w-full bg-white text-primary font-bold py-4 rounded-xl text-base hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                Apply Now <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
