import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-nav border-t border-gray-800 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">LS</span>
          </div>
          <span className="text-white font-bold">LifeSaversElite</span>
        </div>

        <p className="text-gray-500 text-sm">
          &copy; 2026 LifeSavers Elite. All rights reserved.
        </p>

        <div className="flex items-center gap-6">
          <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms</Link>
          <a href="mailto:qcandoit@gmail.com" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}
