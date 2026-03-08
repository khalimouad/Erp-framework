/**
 * ResponsiveTable
 *
 * On desktop (md+): standard <table> layout.
 * On mobile (<md):  each row becomes a card — label on left, value on right.
 *
 * Works standalone (no AdvancedTable dependency) — just pass columns + data.
 */

import { ReactNode, useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp, MoreHorizontal, ChevronsUpDown } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'
import { Skeleton } from '@/components/ui/Spinner'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColAlign = 'left' | 'center' | 'right'

export interface RTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  /** Hide on mobile (omit from card) */
  hideMobile?: boolean
  /** Show only on mobile, hidden on desktop */
  mobileOnly?: boolean
  align?: ColAlign
  width?: string
  minWidth?: string
  render?: (row: T) => ReactNode
}

export interface RTableProps<T extends object> {
  columns: RTableColumn<T>[]
  data: T[]
  rowKey: keyof T
  loading?: boolean
  /** Per-row action menu */
  buildRowActions?: (row: T) => DropdownItem[]
  onRowClick?: (row: T) => void
  /** Selected row keys */
  selected?: Set<string>
  onSelectChange?: (selected: Set<string>) => void
  emptyTitle?: string
  emptyText?: string
  /** Mobile card accent: field to show as colored pill in card header */
  mobileStatusRender?: (row: T) => ReactNode
  /** Sticky header */
  stickyHeader?: boolean
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCellValue<T extends object>(row: T, col: RTableColumn<T>): ReactNode {
  if (col.render) return col.render(row)
  const val = (row as Record<string, unknown>)[col.key as string]
  if (val === null || val === undefined) return <span className="text-gray-300">—</span>
  return String(val)
}

function alignClass(align?: ColAlign) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResponsiveTable<T extends object>({
  columns,
  data,
  rowKey,
  loading,
  buildRowActions,
  onRowClick,
  selected,
  onSelectChange,
  emptyTitle = 'No data',
  emptyText = 'Nothing to show here yet.',
  mobileStatusRender,
  stickyHeader,
  className,
}: RTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const hasSelect = !!onSelectChange
  const desktopCols = columns.filter(c => !c.mobileOnly)
  const mobileCols = columns.filter(c => !c.hideMobile)

  // ─── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey]
        const bv = (b as Record<string, unknown>)[sortKey]
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  // ─── Select all ───────────────────────────────────────────────────────────
  const allKeys = sorted.map(r => String(r[rowKey]))
  const allSelected = allKeys.length > 0 && allKeys.every(k => selected?.has(k))
  const someSelected = !allSelected && allKeys.some(k => selected?.has(k))

  const toggleAll = () => {
    if (!onSelectChange) return
    if (allSelected) onSelectChange(new Set())
    else onSelectChange(new Set(allKeys))
  }

  const toggleRow = (key: string) => {
    if (!onSelectChange || !selected) return
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectChange(next)
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={className}>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {desktopCols.map(c => (
                  <th key={String(c.key)} className="px-4 py-3">
                    <Skeleton className="h-3 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {desktopCols.map(c => (
                    <td key={String(c.key)} className="px-4 py-3">
                      <Skeleton className="h-3.5 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ─── Empty ─────────────────────────────────────────────────────────────────
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <ChevronsUpDown className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">{emptyTitle}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* ─── Mobile card layout ──────────────────────────────────────────── */}
      <div className="md:hidden space-y-2 p-3">
        {sorted.map(row => {
          const key = String(row[rowKey])
          const isSelected = selected?.has(key)
          const actions = buildRowActions?.(row)
          const [firstCol, ...restCols] = mobileCols

          return (
            <div
              key={key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx(
                'bg-white rounded-xl border shadow-sm overflow-hidden transition-all',
                onRowClick && 'cursor-pointer active:scale-[0.99]',
                isSelected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200',
              )}
            >
              {/* Card header */}
              <div className="flex items-start gap-2.5 px-3.5 pt-3 pb-2">
                {hasSelect && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRow(key)}
                    onClick={e => e.stopPropagation()}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {firstCol ? getCellValue(row, firstCol) : key}
                  </div>
                </div>
                {mobileStatusRender && (
                  <div className="shrink-0">{mobileStatusRender(row)}</div>
                )}
                {actions && actions.length > 0 && (
                  <div onClick={e => e.stopPropagation()}>
                    <Dropdown
                      trigger={
                        <button className="p-1.5 -mr-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <MoreHorizontal size={16} />
                        </button>
                      }
                      items={actions}
                      align="right"
                    />
                  </div>
                )}
              </div>

              {/* Card body — remaining columns */}
              {restCols.length > 0 && (
                <div className="px-3.5 pb-3 space-y-1.5 border-t border-gray-50 pt-2">
                  {restCols.map(col => {
                    const val = getCellValue(row, col)
                    return (
                      <div key={String(col.key)} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide shrink-0">
                          {col.label}
                        </span>
                        <span className="text-xs text-gray-700 text-right min-w-0 truncate">
                          {val}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Desktop table layout ────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className={clsx('border-b border-gray-100 bg-gray-50/60', stickyHeader && 'sticky top-0 z-10 backdrop-blur')}>
              {hasSelect && (
                <th className="w-10 pl-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                  />
                </th>
              )}
              {desktopCols.map(col => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={clsx(
                    'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    alignClass(col.align),
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key as string) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                        : <ChevronsUpDown size={12} className="opacity-30" />
                    )}
                  </span>
                </th>
              ))}
              {buildRowActions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const key = String(row[rowKey])
              const isSelected = selected?.has(key)
              const actions = buildRowActions?.(row)

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'border-b border-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-primary-50/40',
                    isSelected && 'bg-primary-50',
                    idx % 2 === 1 && !isSelected && 'bg-gray-50/40',
                  )}
                >
                  {hasSelect && (
                    <td className="pl-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(key)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600"
                      />
                    </td>
                  )}
                  {desktopCols.map(col => (
                    <td
                      key={String(col.key)}
                      className={clsx('px-4 py-3 text-gray-700', alignClass(col.align))}
                    >
                      {getCellValue(row, col)}
                    </td>
                  ))}
                  {actions && (
                    <td className="pr-2 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={15} />
                          </button>
                        }
                        items={actions}
                        align="right"
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
