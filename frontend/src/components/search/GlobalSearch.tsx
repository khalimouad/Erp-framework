import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, Users, Building2, Settings, X } from 'lucide-react'
import clsx from 'clsx'

interface SearchEntry {
  to: string
  label: string
  category: string
  keywords?: string
  icon?: React.ReactNode
}

const ALL_ROUTES: SearchEntry[] = [
  // Core
  { to: '/',          label: 'Dashboard',          category: 'Core',          keywords: 'home overview kpi', icon: <LayoutDashboard size={15} /> },
  { to: '/companies', label: 'Companies',           category: 'Core',          keywords: 'tenant organization', icon: <Building2 size={15} /> },
  { to: '/users',     label: 'Users & Roles',       category: 'Core',          keywords: 'accounts permissions rbac', icon: <Users size={15} /> },
  { to: '/settings',  label: 'Settings',            category: 'Core',          keywords: 'config modules vertical install', icon: <Settings size={15} /> },
  // CRM
  { to: '/crm',       label: 'CRM / Leads',         category: 'CRM',           keywords: 'leads pipeline sales opportunity' },
  // Sales
  { to: '/sales',     label: 'Sales Orders',        category: 'Sales',         keywords: 'so customer order invoice' },
  // Purchasing
  { to: '/purchasing',label: 'Purchase Orders',     category: 'Purchasing',    keywords: 'po vendor supplier buy' },
  // Inventory
  { to: '/inventory', label: 'Inventory / Products',category: 'Inventory',     keywords: 'product stock warehouse sku' },
  // Accounting
  { to: '/accounting',label: 'Invoices',            category: 'Accounting',    keywords: 'invoice billing payment accounting' },
  // HR
  { to: '/hr',        label: 'Employees',           category: 'HR',            keywords: 'staff payroll salary department job' },
  // Medical
  { to: '/medical/patients',     label: 'Patients',      category: 'Medical', keywords: 'clinic hospital patient record' },
  { to: '/medical/appointments', label: 'Appointments',  category: 'Medical', keywords: 'schedule visit consultation booking' },
  { to: '/medical/pharmacy',     label: 'Pharmacy',      category: 'Medical', keywords: 'drug medication prescription stock' },
  // Manufacturing
  { to: '/manufacturing/work-orders', label: 'Work Orders',      category: 'Manufacturing', keywords: 'production mo manufacturing' },
  { to: '/manufacturing/bom',         label: 'Bill of Materials', category: 'Manufacturing', keywords: 'bom recipe components product' },
  // Quality
  { to: '/quality',   label: 'Quality Control',     category: 'Quality',       keywords: 'qc check pass fail inspection' },
]

function match(entry: SearchEntry, q: string): boolean {
  const s = q.toLowerCase()
  return (
    entry.label.toLowerCase().includes(s) ||
    entry.category.toLowerCase().includes(s) ||
    (entry.keywords ?? '').toLowerCase().includes(s)
  )
}

interface Props {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim() === ''
    ? ALL_ROUTES
    : ALL_ROUTES.filter(e => match(e, query))

  // group by category
  const grouped = results.reduce<Record<string, SearchEntry[]>>((acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = []
    acc[entry.category].push(entry)
    return acc
  }, {})

  const flat = results // flat list for keyboard nav

  const go = useCallback((entry: SearchEntry) => {
    navigate(entry.to)
    onClose()
    setQuery('')
    setCursor(0)
  }, [navigate, onClose])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && flat[cursor]) { go(flat[cursor]) }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, flat, cursor, go, onClose])

  // scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, modules, features..."
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-80 py-2">
          {flat.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results for "{query}"</p>
          ) : (
            Object.entries(grouped).map(([category, entries]) => {
              return (
                <div key={category}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {category}
                  </p>
                  {entries.map((entry) => {
                    const idx = flat.indexOf(entry)
                    const active = idx === cursor
                    return (
                      <button
                        key={entry.to}
                        data-idx={idx}
                        onClick={() => go(entry)}
                        onMouseEnter={() => setCursor(idx)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50',
                        )}
                      >
                        <span className={clsx('shrink-0', active ? 'text-primary-600' : 'text-gray-400')}>
                          {entry.icon ?? <span className="w-[15px] h-[15px] block" />}
                        </span>
                        <span className="text-sm font-medium">{entry.label}</span>
                        <span className={clsx('ml-auto text-xs font-mono', active ? 'text-primary-400' : 'text-gray-300')}>
                          {entry.to}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-white border border-gray-200 shadow-sm">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-white border border-gray-200 shadow-sm">↵</kbd> open
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-white border border-gray-200 shadow-sm">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
