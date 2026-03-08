import { ReactNode } from 'react'
import clsx from 'clsx'
import { MoreHorizontal } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'
import { Skeleton } from '@/components/ui/Spinner'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardFieldDef<T> {
  key: keyof T | string
  label?: string
  render?: (row: T) => ReactNode
  /** Show as full-width footer strip */
  footer?: boolean
}

export interface CardViewProps<T> {
  data: T[]
  rowKey: keyof T
  fields: CardFieldDef<T>[]
  /** Header slot: title + optional badge/status */
  renderHeader: (row: T) => ReactNode
  /** Optional image / avatar slot */
  renderAvatar?: (row: T) => ReactNode
  /** Actions shown in the ⋯ dropdown */
  rowActions?: DropdownItem[]
  /** Build row actions dynamically per row */
  buildRowActions?: (row: T) => DropdownItem[]
  onCardClick?: (row: T) => void
  loading?: boolean
  emptyTitle?: string
  emptyText?: string
  /** Grid columns per breakpoint — default: 1 / sm:2 / lg:3 / xl:4 */
  cols?: string
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CardView<T extends object>({
  data,
  rowKey,
  fields,
  renderHeader,
  renderAvatar,
  rowActions,
  buildRowActions,
  onCardClick,
  loading,
  emptyTitle = 'No items',
  emptyText = 'Nothing to display here yet.',
  cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  className,
}: CardViewProps<T>) {

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={clsx('grid gap-4', cols, className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  // ─── Empty state ────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700">{emptyTitle}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">{emptyText}</p>
      </div>
    )
  }

  // ─── Cards grid ─────────────────────────────────────────────────────────────
  const bodyFields = fields.filter(f => !f.footer)
  const footerFields = fields.filter(f => f.footer)

  return (
    <div className={clsx('grid gap-4', cols, className)}>
      {data.map(row => {
        const key = String(row[rowKey])
        const actions = buildRowActions ? buildRowActions(row) : rowActions

        return (
          <div
            key={key}
            onClick={onCardClick ? () => onCardClick(row) : undefined}
            className={clsx(
              'group bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden transition-all duration-150',
              onCardClick && 'cursor-pointer hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5',
            )}
          >
            {/* Card header */}
            <div className="flex items-start gap-3 p-4 pb-3">
              {renderAvatar && (
                <div className="shrink-0">{renderAvatar(row)}</div>
              )}
              <div className="flex-1 min-w-0">{renderHeader(row)}</div>
              {actions && actions.length > 0 && (
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <Dropdown
                    trigger={
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal size={15} />
                      </button>
                    }
                    items={actions}
                    align="right"
                  />
                </div>
              )}
            </div>

            {/* Body fields */}
            {bodyFields.length > 0 && (
              <div className="px-4 pb-3 space-y-2">
                {bodyFields.map(f => {
                  const val = f.render ? f.render(row) : String((row as Record<string, unknown>)[f.key as string] ?? '—')
                  if (!val && val !== 0) return null
                  return (
                    <div key={String(f.key)} className="flex items-start gap-1.5">
                      {f.label && (
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide shrink-0 mt-0.5 w-20">
                          {f.label}
                        </span>
                      )}
                      <span className="text-sm text-gray-700 min-w-0 truncate">{val}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer strip */}
            {footerFields.length > 0 && (
              <div className="mt-auto px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-3 flex-wrap">
                {footerFields.map(f => (
                  <div key={String(f.key)} className="flex items-center gap-1.5">
                    {f.label && <span className="text-[11px] text-gray-400">{f.label}:</span>}
                    <span className="text-xs font-medium text-gray-700">
                      {f.render ? f.render(row) : String((row as Record<string, unknown>)[f.key as string] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Stat Card (KPI / metric card) ───────────────────────────────────────────

interface StatCardProps {
  title: string
  value: ReactNode
  subtitle?: string
  icon?: ReactNode
  iconColor?: string
  trend?: { value: number; label?: string }
  onClick?: () => void
  className?: string
}

export function StatCard({ title, value, subtitle, icon, iconColor = 'bg-primary-100 text-primary-600', trend, onClick, className }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary-200',
        className,
      )}
    >
      {icon && (
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconColor)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={clsx('text-xs font-medium mt-1 flex items-center gap-1', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            {trend.label && <span className="text-gray-400 font-normal">{trend.label}</span>}
          </p>
        )}
      </div>
    </div>
  )
}
