/**
 * AdvancedTable — Odoo-style data grid.
 *
 * Features:
 *  ✓ Multi-select rows (checkbox + select-all)
 *  ✓ Column sorting (click header arrow)
 *  ✓ Global keyword search
 *  ✓ Per-column filters with operator (=, contains, >, <, ...)
 *  ✓ Pagination + page-size selector
 *  ✓ Bulk-action toolbar (appears when ≥1 rows selected)
 *  ✓ Per-row action dropdown (edit, duplicate, delete, …)
 *  ✓ Built-in column types: text, number, currency, date, datetime, badge, boolean
 *  ✓ Loading skeleton rows
 *  ✓ Empty state
 *  ✓ Export CSV (selected or all)
 *  ✓ Optional click-row callback
 */

import {
  useState, useMemo, useCallback, ReactNode,
} from 'react'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Search, Filter, Download, X, MoreVertical,
  Check, Minus, ChevronLeft, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { Skeleton } from '@/components/ui/Spinner'
import type { ColumnDef, RowAction, BulkAction, BadgeColor } from '@/types/ui'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k]
    return undefined
  }, obj)
}

function formatDate(value: unknown, includeTime = false): string {
  if (!value) return '—'
  const d = new Date(value as string)
  if (isNaN(d.getTime())) return String(value)
  return includeTime
    ? d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function exportCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: ColumnDef<T>[],
  filename = 'export',
) {
  const headers = columns.filter(c => !c.hidden).map(c => c.label)
  const lines = rows.map(row =>
    columns
      .filter(c => !c.hidden)
      .map(c => {
        const val = getNestedValue(row, c.key)
        return `"${String(val ?? '').replace(/"/g, '""')}"`
      })
      .join(','),
  )
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── types ───────────────────────────────────────────────────────────────────

interface FilterState {
  column: string
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (dir === 'asc')  return <ChevronUp size={13} className="text-primary-600 shrink-0" />
  if (dir === 'desc') return <ChevronDown size={13} className="text-primary-600 shrink-0" />
  return <ChevronsUpDown size={13} className="text-gray-300 shrink-0" />
}

function CellValue<T extends Record<string, unknown>>({
  col, row,
}: { col: ColumnDef<T>; row: T }) {
  if (col.render) return <>{col.render(row)}</>

  const raw = getNestedValue(row, col.key)

  if (raw == null || raw === '') return <span className="text-gray-300">—</span>

  switch (col.type) {
    case 'badge': {
      const color: BadgeColor = col.badgeMap?.[String(raw)] ?? 'gray'
      return <Badge color={color} dot>{String(raw)}</Badge>
    }
    case 'currency': {
      const sym = col.currencySymbol ?? '$'
      return <span>{sym}{Number(raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    }
    case 'number':
      return <span>{Number(raw).toLocaleString()}</span>
    case 'boolean':
      return raw
        ? <Check size={15} className="text-green-600" />
        : <Minus size={15} className="text-gray-300" />
    case 'date':
      return <span>{formatDate(raw, false)}</span>
    case 'datetime':
      return <span>{formatDate(raw, true)}</span>
    default:
      return <span className="truncate">{String(raw)}</span>
  }
}

// ─── FilterPanel ─────────────────────────────────────────────────────────────

function FilterPanel<T>({
  columns,
  filters,
  onChange,
  onClose,
}: {
  columns: ColumnDef<T>[]
  filters: FilterState[]
  onChange: (f: FilterState[]) => void
  onClose: () => void
}) {
  const filterable = columns.filter(c => c.filterable)
  const [col, setCol]      = useState(filterable[0]?.key ?? '')
  const [op,  setOp]       = useState<FilterState['operator']>('contains')
  const [val, setVal]      = useState('')

  const add = () => {
    if (!col || !val.trim()) return
    onChange([...filters, { column: col, operator: op, value: val.trim() }])
    setVal('')
  }

  const remove = (i: number) => onChange(filters.filter((_, idx) => idx !== i))

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-md p-4 space-y-3 w-80">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={14} /></button>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="space-y-1">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1 text-xs">
              <span className="text-primary-700 font-medium">{filterable.find(c => c.key === f.column)?.label}</span>
              <span className="text-primary-500">{f.operator}</span>
              <span className="text-primary-700">{f.value}</span>
              <button onClick={() => remove(i)} className="ml-auto text-primary-400 hover:text-primary-700"><X size={11} /></button>
            </div>
          ))}
          <button onClick={() => onChange([])} className="text-xs text-red-500 hover:underline">Clear all</button>
        </div>
      )}

      {/* Add filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={col}
            onChange={e => setCol(e.target.value)}
          >
            {filterable.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={op}
            onChange={e => setOp(e.target.value as FilterState['operator'])}
          >
            <option value="contains">contains</option>
            <option value="eq">=</option>
            <option value="neq">≠</option>
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
            <option value="gte">≥</option>
            <option value="lte">≤</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Value…"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <Button size="xs" variant="primary" onClick={add}>Add</Button>
        </div>
      </div>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 25, 50, 100]

interface AdvancedTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  /** Primary key field — default 'id' */
  rowKey?: string
  loading?: boolean
  rowActions?: RowAction<T>[]
  bulkActions?: BulkAction<T>[]
  /** Called when a row is clicked (not via action buttons) */
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyText?: string
  exportFilename?: string
  /** Default rows per page */
  defaultPageSize?: number
  /** If true, hide the search bar */
  hideSearch?: boolean
  className?: string
}

export function AdvancedTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey = 'id',
  loading,
  rowActions = [],
  bulkActions = [],
  onRowClick,
  emptyTitle = 'No records found',
  emptyText  = 'Try adjusting your search or filters.',
  exportFilename = 'export',
  defaultPageSize = 25,
  hideSearch,
  className,
}: AdvancedTableProps<T>) {

  const visibleCols = useMemo(() => columns.filter(c => !c.hidden), [columns])

  // ── state ──────────────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState('')
  const [sortKey,   setSortKey]   = useState<string | null>(null)
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [filters,   setFilters]   = useState<FilterState[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [page,      setPage]      = useState(1)
  const [pageSize,  setPageSize]  = useState(defaultPageSize)
  const [selected,  setSelected]  = useState<Set<unknown>>(new Set())

  // ── sort handler ────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }, [sortKey])

  // ── filtered + sorted data ──────────────────────────────────────────────────
  const processed = useMemo(() => {
    let rows = [...data]

    // Global search
    if (search.trim()) {
      const q = search.toLowerCase()
      const searchCols = visibleCols.filter(c => c.searchable !== false)
      rows = rows.filter(row =>
        searchCols.some(c => {
          const v = getNestedValue(row, c.key)
          return v != null && String(v).toLowerCase().includes(q)
        }),
      )
    }

    // Column filters
    filters.forEach(f => {
      rows = rows.filter(row => {
        const v = String(getNestedValue(row, f.column) ?? '')
        const fv = f.value.toLowerCase()
        switch (f.operator) {
          case 'contains': return v.toLowerCase().includes(fv)
          case 'eq':       return v.toLowerCase() === fv
          case 'neq':      return v.toLowerCase() !== fv
          case 'gt':       return parseFloat(v) > parseFloat(f.value)
          case 'lt':       return parseFloat(v) < parseFloat(f.value)
          case 'gte':      return parseFloat(v) >= parseFloat(f.value)
          case 'lte':      return parseFloat(v) <= parseFloat(f.value)
          default:         return true
        }
      })
    })

    // Sort
    if (sortKey) {
      rows.sort((a, b) => {
        const av = getNestedValue(a, sortKey) ?? ''
        const bv = getNestedValue(b, sortKey) ?? ''
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return rows
  }, [data, search, filters, sortKey, sortDir, visibleCols])

  // ── pagination ─────────────────────────────────────────────────────────────
  const totalRows  = processed.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const pageStart  = (page - 1) * pageSize
  const pageEnd    = Math.min(pageStart + pageSize, totalRows)
  const pageRows   = processed.slice(pageStart, pageEnd)

  // Reset to page 1 when filter/search changes
  useMemo(() => setPage(1), [search, filters])

  // ── selection ──────────────────────────────────────────────────────────────
  const pageIds  = pageRows.map(r => getNestedValue(r, rowKey))
  const allSelected   = pageIds.length > 0 && pageIds.every(id => selected.has(id))
  const someSelected  = pageIds.some(id => selected.has(id)) && !allSelected
  const selectedRows  = data.filter(r => selected.has(getNestedValue(r, rowKey)))

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected)
      pageIds.forEach(id => next.delete(id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      pageIds.forEach(id => next.add(id))
      setSelected(next)
    }
  }
  const toggleRow = (id: unknown) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  // ── CSV export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = selected.size > 0 ? selectedRows : processed
    exportCSV(rows, visibleCols, exportFilename)
  }

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className={clsx('flex flex-col', className)}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">

        {/* Search */}
        {!hideSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Filter button */}
        <div className="relative">
          <Button
            size="sm"
            variant={filters.length > 0 ? 'primary' : 'ghost'}
            icon={<Filter size={14} />}
            onClick={() => setShowFilter(v => !v)}
          >
            {filters.length > 0 ? `${filters.length} Filter${filters.length > 1 ? 's' : ''}` : 'Filter'}
          </Button>
          {showFilter && (
            <div className="absolute top-10 left-0 z-30">
              <FilterPanel
                columns={visibleCols}
                filters={filters}
                onChange={f => { setFilters(f); setPage(1) }}
                onClose={() => setShowFilter(false)}
              />
            </div>
          )}
        </div>

        {/* Export */}
        <Button size="sm" variant="ghost" icon={<Download size={14} />} onClick={handleExport}>
          Export{selected.size > 0 ? ` (${selected.size})` : ''}
        </Button>

        {/* Page size */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-gray-400">Per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="text-xs border border-gray-200 rounded-lg px-1.5 py-1
                       focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Bulk action bar ─────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 border-b border-primary-200">
          <span className="text-sm font-medium text-primary-700">
            {selected.size} selected
          </span>
          <div className="w-px h-4 bg-primary-200" />
          {bulkActions.map(action => (
            <Button
              key={action.key}
              size="xs"
              variant={action.variant === 'danger' ? 'danger' : 'secondary'}
              icon={action.icon}
              onClick={() => { action.onClick(selectedRows); setSelected(new Set()) }}
            >
              {action.label}
            </Button>
          ))}
          <Button size="xs" variant="ghost" icon={<X size={12} />} onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* Head */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {/* Checkbox */}
              <th className="w-10 px-3 py-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center justify-center w-4 h-4 rounded border border-gray-300
                             hover:border-primary-500 transition-colors"
                >
                  {allSelected
                    ? <Check size={11} className="text-primary-600" />
                    : someSelected
                    ? <Minus size={11} className="text-primary-400" />
                    : null}
                </button>
              </th>

              {/* Columns */}
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={clsx(
                    'px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.align === 'right'  && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon dir={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}

              {/* Row actions column */}
              {rowActions.length > 0 && <th className="w-10 px-2 py-3" />}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              /* Skeleton rows */
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="bg-white">
                  <td className="px-3 py-3"><Skeleton className="w-4 h-4" /></td>
                  {visibleCols.map(col => (
                    <td key={col.key} className="px-3 py-3">
                      <Skeleton className="h-4 rounded" style={{ width: col.width ?? '80%' }} />
                    </td>
                  ))}
                  {rowActions.length > 0 && <td />}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.length + 1 + (rowActions.length ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="text-gray-400">
                    <Search size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">{emptyTitle}</p>
                    <p className="text-sm mt-1">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map(row => {
                const id       = getNestedValue(row, rowKey)
                const isSelected = selected.has(id)
                const visible  = rowActions.filter(a => !a.hidden?.(row))

                return (
                  <tr
                    key={String(id)}
                    onClick={() => onRowClick?.(row)}
                    className={clsx(
                      'bg-white transition-colors',
                      isSelected && 'bg-primary-50',
                      onRowClick && 'cursor-pointer',
                      !isSelected && onRowClick && 'hover:bg-gray-50',
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-3 py-3"
                      onClick={e => { e.stopPropagation(); toggleRow(id) }}
                    >
                      <button
                        className={clsx(
                          'flex items-center justify-center w-4 h-4 rounded border transition-colors',
                          isSelected
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 hover:border-primary-500',
                        )}
                      >
                        {isSelected && <Check size={11} className="text-white" />}
                      </button>
                    </td>

                    {/* Data cells */}
                    {visibleCols.map(col => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-3 py-3 text-sm text-gray-700 max-w-xs',
                          col.align === 'right'  && 'text-right',
                          col.align === 'center' && 'text-center',
                        )}
                      >
                        <CellValue col={col} row={row} />
                      </td>
                    ))}

                    {/* Row action dropdown */}
                    {rowActions.length > 0 && (
                      <td
                        className="px-2 py-3 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        {visible.length > 0 && (
                          <Dropdown
                            align="right"
                            trigger={
                              <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                                <MoreVertical size={15} />
                              </button>
                            }
                            items={visible.map(a => ({
                              key: a.key,
                              label: a.label,
                              icon: a.icon,
                              variant: a.variant === 'danger' ? 'danger' : 'default',
                              onClick: () => a.onClick(row),
                            }))}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white text-sm text-gray-500">
        <span>
          {totalRows === 0 ? '0 records' : `${pageStart + 1}–${pageEnd} of ${totalRows}`}
          {search && ` (filtered from ${data.length})`}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="xs"
            icon={<ChevronLeft size={14} />}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          />
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
            let p: number
            if (totalPages <= 7) {
              p = i + 1
            } else if (page <= 4) {
              p = i + 1
              if (i === 6) p = totalPages
            } else if (page >= totalPages - 3) {
              p = totalPages - 6 + i
            } else {
              const offsets = [-3, -2, -1, 0, 1, 2, 3]
              p = page + offsets[i]
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={clsx(
                  'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                  p === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {p}
              </button>
            )
          })}
          <Button
            variant="ghost" size="xs"
            icon={<ChevronRight size={14} />}
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          />
        </div>
      </div>
    </div>
  )
}
