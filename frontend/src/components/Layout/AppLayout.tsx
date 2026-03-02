import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuthStore } from '@/store/auth'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { AiChat } from '@/components/ai/AiChat'

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

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
    <div className="flex min-h-screen">
      <Sidebar onSearch={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AiChat />
    </div>
  )
}
