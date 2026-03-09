import { useEffect, useState } from 'react'
import { useModulesStore, type Module } from '@/store/modules'
import { Package, CheckCircle, Circle, AlertCircle, ChevronRight } from 'lucide-react'

const CATEGORY_ORDER = ['Core', 'Sales', 'Inventory', 'Finance', 'HR', 'Operations', 'General']

function groupByCategory(modules: Module[]): Record<string, Module[]> {
  const groups: Record<string, Module[]> = {}
  for (const mod of modules) {
    const cat = mod.category || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(mod)
  }
  return groups
}

function sortedCategories(groups: Record<string, Module[]>): string[] {
  return Object.keys(groups).sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
  )
}

export default function Modules() {
  const { modules, loading, fetchModules, installModule, uninstallModule, isInstalled } =
    useModulesStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchModules()
  }, [])

  async function handleInstall(name: string) {
    setBusy(name)
    setError(null)
    try {
      await installModule(name)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? `Failed to install ${name}`)
    } finally {
      setBusy(null)
    }
  }

  async function handleUninstall(name: string) {
    setBusy(name)
    setError(null)
    try {
      await uninstallModule(name)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? `Failed to uninstall ${name}`)
    } finally {
      setBusy(null)
    }
  }

  const groups = groupByCategory(modules)
  const categories = sortedCategories(groups)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Module Manager</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Install or uninstall modules. Dependencies are enforced automatically.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && modules.length === 0 ? (
        <div className="text-center text-gray-400 py-16">Loading modules...</div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups[category].map((mod) => (
                  <ModuleCard
                    key={mod.name}
                    mod={mod}
                    busy={busy === mod.name}
                    onInstall={() => handleInstall(mod.name)}
                    onUninstall={() => handleUninstall(mod.name)}
                    getModuleLabel={(name) =>
                      modules.find((m) => m.name === name)?.label ?? name
                    }
                    isDepInstalled={isInstalled}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ModuleCardProps {
  mod: Module
  busy: boolean
  onInstall: () => void
  onUninstall: () => void
  getModuleLabel: (name: string) => string
  isDepInstalled: (name: string) => boolean
}

function ModuleCard({
  mod,
  busy,
  onInstall,
  onUninstall,
  getModuleLabel,
  isDepInstalled,
}: ModuleCardProps) {
  const installed = mod.state === 'installed'
  const missingDeps = mod.depends.filter(
    (d) => d !== 'base' && d !== 'users' && d !== 'companies' && !isDepInstalled(d)
  )

  return (
    <div
      className={[
        'rounded-xl border p-4 flex flex-col gap-3 transition-colors',
        installed
          ? 'bg-white border-green-200'
          : 'bg-gray-50 border-gray-200',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'mt-0.5 rounded-lg p-2 shrink-0',
            installed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400',
          ].join(' ')}
        >
          <Package size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{mod.label}</span>
            <span className="text-xs text-gray-400 font-mono">{mod.version}</span>
          </div>
          {mod.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{mod.description}</p>
          )}
        </div>
        <div className="shrink-0">
          {installed ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : (
            <Circle size={18} className="text-gray-300" />
          )}
        </div>
      </div>

      {/* Dependencies */}
      {mod.depends.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {mod.depends.map((dep) => (
            <span
              key={dep}
              className={[
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-mono',
                isDepInstalled(dep)
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200',
              ].join(' ')}
            >
              <ChevronRight size={10} />
              {getModuleLabel(dep)}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      {!mod.auto_install && (
        <div className="flex justify-end">
          {installed ? (
            <button
              onClick={onUninstall}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Working...' : 'Uninstall'}
            </button>
          ) : (
            <button
              onClick={onInstall}
              disabled={busy || missingDeps.length > 0}
              title={
                missingDeps.length > 0
                  ? `Install dependencies first: ${missingDeps.join(', ')}`
                  : undefined
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Installing...' : missingDeps.length > 0 ? 'Missing deps' : 'Install'}
            </button>
          )}
        </div>
      )}

      {mod.auto_install && (
        <div className="flex justify-end">
          <span className="text-xs text-gray-400 italic">Core — always installed</span>
        </div>
      )}
    </div>
  )
}
