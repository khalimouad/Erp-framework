/**
 * PageTemplate — the single layout wrapper every ERP page uses.
 *
 * Structure:
 * ┌──────────────────────────────────────────────────────────┐
 * │ Breadcrumb                            [Action buttons]   │
 * │ Title + subtitle                      [More dropdown]    │
 * ├──────────────────────────────────────────────────────────┤
 * │ [Status bar]          (form mode only, optional)        │
 * ├──────────────────────────────────────────────────────────┤
 * │ [View tabs]           (list/form/kanban switcher)       │
 * ├──────────────────────────────────────────────────────────┤
 * │                                                          │
 * │   children  (DataTable, FormView, Kanban, etc.)         │
 * │                                                          │
 * └──────────────────────────────────────────────────────────┘
 */

import { ReactNode } from 'react'
import clsx from 'clsx'
import { LayoutList, LayoutGrid, Kanban } from 'lucide-react'
import { Breadcrumb } from './Breadcrumb'
import { ActionBar } from './ActionBar'
import { StatusBar } from './StatusBar'
import { Spinner } from '@/components/ui/Spinner'
import type { ActionDef, BreadcrumbItem, StatusStage } from '@/types/ui'

export type ViewType = 'list' | 'form' | 'kanban'

const viewIcons: Record<ViewType, ReactNode> = {
  list:   <LayoutList size={15} />,
  form:   <LayoutGrid size={15} />,
  kanban: <Kanban size={15} />,
}
const viewLabels: Record<ViewType, string> = {
  list:   'List',
  form:   'Form',
  kanban: 'Kanban',
}

interface PageTemplateProps {
  /** Page / model title, e.g. "Leads" or "John Doe" */
  title: string
  subtitle?: string

  breadcrumbs?: BreadcrumbItem[]

  /** Primary buttons shown in the header (Save, Edit, New…) */
  actions?: ActionDef[]
  /** Secondary actions placed in "⋮ Actions" dropdown */
  moreActions?: ActionDef[]

  /** Render status pipeline (typically in form mode) */
  statusStages?: StatusStage[]
  currentStatus?: string
  onStatusChange?: (key: string) => void

  /** Which view tabs to show and which is active */
  availableViews?: ViewType[]
  activeView?: ViewType
  onViewChange?: (v: ViewType) => void

  /** Whole-page loading overlay */
  loading?: boolean

  children: ReactNode

  /** Extra area to the right of children (e.g. chatter panel) */
  aside?: ReactNode
}

export function PageTemplate({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  moreActions = [],
  statusStages,
  currentStatus,
  onStatusChange,
  availableViews,
  activeView,
  onViewChange,
  loading,
  children,
  aside,
}: PageTemplateProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
        {/* Row 1: breadcrumb + view tabs */}
        <div className="flex items-center justify-between mb-1">
          <Breadcrumb items={breadcrumbs.length ? breadcrumbs : [{ label: title }]} />

          {/* View switcher */}
          {availableViews && availableViews.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {availableViews.map(v => (
                <button
                  key={v}
                  onClick={() => onViewChange?.(v)}
                  title={viewLabels[v]}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                    v === activeView
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {viewIcons[v]}
                  <span className="hidden sm:inline">{viewLabels[v]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: title + action buttons */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <ActionBar actions={actions} moreActions={moreActions} />
        </div>

        {/* Status bar */}
        {statusStages && statusStages.length > 0 && currentStatus && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <StatusBar
              stages={statusStages}
              current={currentStatus}
              onChange={onStatusChange}
              readonly={!onStatusChange}
            />
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" label="Loading…" />
            </div>
          ) : (
            children
          )}
        </div>

        {aside && (
          <aside className="w-80 border-l border-gray-200 bg-white overflow-y-auto shrink-0">
            {aside}
          </aside>
        )}
      </div>
    </div>
  )
}
