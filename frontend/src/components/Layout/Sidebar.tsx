import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, Settings, LogOut, ChevronDown, Search, X, Puzzle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useVerticalStore } from '@/store/vertical'
import { useModulesStore } from '@/store/modules'
import { VERTICALS } from '@/config/verticals'
import clsx from 'clsx'
import { useState } from 'react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    isActive ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white',
  )

interface SidebarProps {
  onSearch: () => void
  onClose?: () => void
}

export default function Sidebar({ onSearch, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { vertical, setVertical } = useVerticalStore()
  const { isInstalled, fetchModules, modules } = useModulesStore()
  const [showPicker, setShowPicker] = useState(false)

  const config = VERTICALS[vertical]

  // Fetch modules once on mount so nav items reflect install state
  useEffect(() => {
    if (modules.length === 0) {
      fetchModules()
    }
  }, [])

  // Only show nav items whose module is installed
  const visibleNavItems = config.navItems.filter((item) => isInstalled(item.module))

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col h-full min-h-screen">
      {/* Logo + Vertical selector */}
      <div className="p-5 border-b border-primary-700 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">NextERP</h1>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="mt-2 flex items-center gap-1 text-xs hover:text-white transition-colors"
        >
          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
            {config.label}
          </span>
          <ChevronDown size={12} className="text-primary-400" />
        </button>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 -mr-1 -mt-1 rounded-lg text-primary-400 hover:text-white hover:bg-primary-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Vertical picker */}
      {showPicker && (
        <div className="bg-primary-800 border-b border-primary-700 p-3 space-y-1">
          {(Object.keys(VERTICALS) as Array<keyof typeof VERTICALS>).map((v) => (
            <button
              key={v}
              onClick={() => { setVertical(v); setShowPicker(false) }}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg transition-colors',
                v === vertical
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-300 hover:bg-primary-700 hover:text-white',
              )}
            >
              <span className="text-xs font-semibold block">{VERTICALS[v].label}</span>
              <span className="text-primary-400 text-xs">{VERTICALS[v].description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search button */}
      <div className="px-4 py-3 border-b border-primary-800">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary-800 hover:bg-primary-700 text-primary-300 hover:text-white text-sm transition-colors group"
        >
          <Search size={14} className="shrink-0" />
          <span className="flex-1 text-left text-xs">Search...</span>
          <span className="hidden sm:inline-flex items-center gap-0.5">
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-primary-700 group-hover:bg-primary-600 border border-primary-600 font-mono">⌘</kbd>
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-primary-700 group-hover:bg-primary-600 border border-primary-600 font-mono">K</kbd>
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>

        {visibleNavItems.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-primary-500 uppercase tracking-wider">
              {config.label}
            </p>
            {visibleNavItems.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </>
        )}

        <p className="px-3 pt-3 pb-1 text-xs font-semibold text-primary-500 uppercase tracking-wider">
          Core
        </p>
        <NavLink to="/companies" className={navLinkClass}>
          <Building2 size={16} /> Companies
        </NavLink>
        <NavLink to="/users" className={navLinkClass}>
          <Users size={16} /> Users
        </NavLink>
        <NavLink to="/settings/modules" className={navLinkClass}>
          <Puzzle size={16} /> Modules
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings size={16} /> Settings
        </NavLink>
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
