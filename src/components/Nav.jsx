import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-nav shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">LS</span>
            </div>
            <span className="text-white font-bold text-lg">LifeSaversElite</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#earn" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Earn</a>
            <Link to="/agents/enroll" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Agents & Brokers</Link>
            <Link to="/apply" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Join</Link>
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Login</Link>
            <Link to="/apply" className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Apply Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-nav border-t border-gray-800 px-4 py-4 flex flex-col gap-4">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-gray-300 text-sm font-medium">How It Works</a>
          <a href="#earn" onClick={() => setOpen(false)} className="text-gray-300 text-sm font-medium">Earn</a>
          <Link to="/agents/enroll" onClick={() => setOpen(false)} className="text-gray-300 text-sm font-medium">Agents & Brokers</Link>
          <Link to="/apply" onClick={() => setOpen(false)} className="text-gray-300 text-sm font-medium">Join</Link>
          <Link to="/login" onClick={() => setOpen(false)} className="text-gray-300 text-sm font-medium">Login</Link>
          <Link to="/apply" onClick={() => setOpen(false)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold text-center">Apply Now</Link>
        </div>
      )}
    </nav>
  )
}
