import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  Package,
  UserCheck,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import clsx from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/crm', label: 'CRM', icon: TrendingUp },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/hr', label: 'HR', icon: UserCheck },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <h1 className="text-xl font-bold tracking-tight">NextERP</h1>
        <p className="text-primary-300 text-xs mt-1">v1.0.0</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-primary-700">
        <p className="text-primary-300 text-xs truncate">{user?.email}</p>
        <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 text-primary-300 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
