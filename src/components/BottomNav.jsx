import React from 'react'

export default function BottomNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav border-t border-gray-800 z-40">
      <div className="flex items-center justify-around h-16 max-w-xl mx-auto">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                active ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
