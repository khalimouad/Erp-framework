import { useState, useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/store/auth'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { AiChat } from '@/components/ai/AiChat'
import { Search, Menu } from 'lucide-react'

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [])

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (drawer on mobile, static on desktop) ────────────────── */}
      <div className={[
        'fixed inset-y-0 left-0 z-50 md:relative md:flex md:shrink-0',
        'transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}>
        <Sidebar
          onSearch={() => { setSearchOpen(true); setSidebarOpen(false) }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-2 px-3 py-3 bg-primary-900 text-white shrink-0 shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-primary-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <span className="flex-1 text-base font-bold tracking-tight text-center">NextERP</span>

          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl hover:bg-primary-800 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AiChat />
    </div>
  )
}
