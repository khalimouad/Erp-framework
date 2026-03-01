import Header from '@/components/Layout/Header'
import { useVerticalStore } from '@/store/vertical'
import { VERTICALS } from '@/config/verticals'
import type { Vertical } from '@/types'
import clsx from 'clsx'

export default function Settings() {
  const { vertical, setVertical } = useVerticalStore()

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-1">Business Vertical</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose the industry profile. This changes the navigation and the set of active modules.
            The backend VERTICAL setting must match for API calls to work.
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

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Backend Configuration</h3>
          <p className="text-xs text-gray-500 mb-3">
            To switch verticals on the backend, set <code className="bg-gray-100 px-1 rounded">VERTICAL</code> in{' '}
            <code className="bg-gray-100 px-1 rounded">backend/.env</code> and restart the server.
          </p>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono space-y-1">
            <p># backend/.env</p>
            <p>VERTICAL=<span className="text-yellow-300">{vertical}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
