import { NavLink } from 'react-router-dom'
import { Home, List, BarChart2, Users, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Головна' },
  { to: '/records', icon: List, label: 'Записи' },
  { to: '/statistics', icon: BarChart2, label: 'Статистика' },
  { to: '/clients', icon: Users, label: 'Замовники' },
  { to: '/settings', icon: Settings, label: 'Налаш.' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-blue-500' : 'text-gray-500'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
