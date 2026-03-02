import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2, Package, Sliders, Layers } from 'lucide-react'
import clsx from 'clsx'

import { PageTemplate } from '@/components/layout/PageTemplate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useVerticalStore } from '@/store/vertical'
import { VERTICALS } from '@/config/verticals'
import { baseApi } from '@/api/client'
import type { Vertical } from '@/types'

// ── types ────────────────────────────────────────────────────────────────────

interface IrModule {
  id: number
  name: string
  label: string
  description: string | null
  version: string
  category: string
  state: 'installed' | 'uninstalled'
  depends: string[]
  auto_install: boolean
  installed_at: string | null
}

interface IrConfig {
  id: number
  key: string
  value: string | null
  description: string | null
  group: string
  value_type: string
}

type Tab = 'modules' | 'config' | 'vertical'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'modules',  label: 'Modules',       icon: <Package size={15} /> },
  { key: 'config',   label: 'Configuration', icon: <Sliders size={15} /> },
  { key: 'vertical', label: 'Vertical',      icon: <Layers size={15} />  },
]

// ── Modules tab ───────────────────────────────────────────────────────────────

function ModulesTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<IrModule[]>({
    queryKey: ['base-modules'],
    queryFn: () => baseApi.listModules().then(r => r.data),
  })

  const installMutation = useMutation({
    mutationFn: (name: string) => baseApi.installModule(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['base-modules'] }),
  })
  const uninstallMutation = useMutation({
    mutationFn: (name: string) => baseApi.uninstallModule(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['base-modules'] }),
  })

  const categories = [...new Set((data ?? []).map(m => m.category))].sort()

  if (isLoading) {
    return <div className="space-y-2 p-4">{[...Array(6)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
    ))}</div>
  }

  return (
    <div className="space-y-6 p-6">
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {cat}
          </h3>
          <div className="space-y-2">
            {(data ?? []).filter(m => m.category === cat).map(mod => (
              <div
                key={mod.name}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
              >
                {/* Icon placeholder */}
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-primary-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{mod.label}</span>
                    <span className="text-xs text-gray-400">v{mod.version}</span>
                    {mod.auto_install && (
                      <Badge color="purple" size="xs">Core</Badge>
                    )}
                  </div>
                  {mod.description && (
                    <p className="text-sm text-gray-500 truncate">{mod.description}</p>
                  )}
                  {mod.depends.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Depends on: {mod.depends.join(', ')}
                    </p>
                  )}
                </div>

                {/* State + action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge
                    color={mod.state === 'installed' ? 'green' : 'gray'}
                    dot
                    size="sm"
                  >
                    {mod.state === 'installed' ? 'Installed' : 'Not installed'}
                  </Badge>

                  {!mod.auto_install && (
                    mod.state === 'installed' ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        loading={uninstallMutation.isPending && uninstallMutation.variables === mod.name}
                        onClick={() => uninstallMutation.mutate(mod.name)}
                      >
                        Uninstall
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        loading={installMutation.isPending && installMutation.variables === mod.name}
                        onClick={() => installMutation.mutate(mod.name)}
                      >
                        Install
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Config tab ────────────────────────────────────────────────────────────────

function ConfigTab() {
  const qc = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading } = useQuery<IrConfig[]>({
    queryKey: ['base-config'],
    queryFn: () => baseApi.listConfig().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      baseApi.setConfig(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['base-config'] })
      setEditingKey(null)
    },
  })

  const groups = [...new Set((data ?? []).map(c => c.group))].sort()

  const GROUP_LABELS: Record<string, string> = {
    general: 'General',
    security: 'Security',
    mail: 'Mail / Email',
    accounting: 'Accounting',
    hr: 'HR',
  }

  if (isLoading) {
    return <div className="space-y-2 p-4">{[...Array(8)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
    ))}</div>
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      {groups.map(group => (
        <div key={group}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            {GROUP_LABELS[group] ?? group}
          </h3>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {(data ?? []).filter(c => c.group === group).map((cfg, idx, arr) => (
              <div
                key={cfg.key}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3 bg-white',
                  idx < arr.length - 1 && 'border-b border-gray-100',
                )}
              >
                {/* Key + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium text-gray-800">{cfg.key}</code>
                    <Badge color="gray" size="xs">{cfg.value_type}</Badge>
                  </div>
                  {cfg.description && (
                    <p className="text-xs text-gray-400">{cfg.description}</p>
                  )}
                </div>

                {/* Value / editor */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingKey === cfg.key ? (
                    <>
                      <input
                        autoFocus
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingKey(null)
                          if (e.key === 'Enter') saveMutation.mutate({ key: cfg.key, value: editValue })
                        }}
                      />
                      <Button
                        size="xs"
                        variant="primary"
                        loading={saveMutation.isPending}
                        onClick={() => saveMutation.mutate({ key: cfg.key, value: editValue })}
                      >
                        Save
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setEditingKey(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                        {cfg.value ?? <span className="text-gray-400 italic">empty</span>}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingKey(cfg.key)
                          setEditValue(cfg.value ?? '')
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Vertical tab ──────────────────────────────────────────────────────────────

function VerticalTab() {
  const { vertical, setVertical } = useVerticalStore()

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Business Vertical</h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose the industry profile that best describes your business.
          This switches the navigation and the set of active modules.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(VERTICALS) as Vertical[]).map((v) => {
            const cfg = VERTICALS[v]
            return (
              <button
                key={v}
                onClick={() => setVertical(v)}
                className={clsx(
                  'text-left p-4 rounded-xl border-2 transition-all',
                  v === vertical
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white',
                )}
              >
                <span className={clsx('inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2', cfg.color)}>
                  {cfg.label}
                </span>
                <p className="text-sm text-gray-600">{cfg.description}</p>
                <ul className="mt-2 text-xs text-gray-400 space-y-0.5">
                  {cfg.navItems.map((n) => (
                    <li key={n.to}>• {n.label}</li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 bg-white">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Backend .env</h4>
        <p className="text-xs text-gray-500 mb-3">
          Set <code className="bg-gray-100 px-1 rounded">VERTICAL</code> in{' '}
          <code className="bg-gray-100 px-1 rounded">backend/.env</code> and restart to switch the API.
        </p>
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono space-y-1">
          <p># backend/.env</p>
          <p>VERTICAL=<span className="text-yellow-300">{vertical}</span></p>
        </div>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState<Tab>('modules')

  return (
    <PageTemplate
      title="Settings"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <nav className="flex gap-1 px-6 pt-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'modules'  && <ModulesTab />}
      {tab === 'config'   && <ConfigTab />}
      {tab === 'vertical' && <VerticalTab />}
    </PageTemplate>
  )
}
