import { ReactNode, useState, useRef } from 'react'
import clsx from 'clsx'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DropdownItem } from '@/components/ui/Dropdown'
import { Skeleton } from '@/components/ui/Spinner'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanColumn<TStatus extends string = string> {
  key: TStatus
  label: string
  color?: string          // header accent bar color (Tailwind bg- class)
  textColor?: string      // header text color
  limit?: number          // WIP limit
}

export interface KanbanCardDef<T> {
  /** Main title */
  renderTitle: (row: T) => ReactNode
  /** Subtitle below title */
  renderSubtitle?: (row: T) => ReactNode
  /** Bottom meta row (e.g. badge + date + avatar) */
  renderMeta?: (row: T) => ReactNode
  /** Right side of card header (e.g. currency amount) */
  renderValue?: (row: T) => ReactNode
  /** Per-card action menu */
  buildRowActions?: (row: T) => DropdownItem[]
  onCardClick?: (row: T) => void
}

export interface KanbanViewProps<T extends object, TStatus extends string = string> {
  data: T[]
  rowKey: keyof T
  statusKey: keyof T
  columns: KanbanColumn<TStatus>[]
  card: KanbanCardDef<T>
  /** Called when a card is dragged to a new column */
  onStatusChange?: (row: T, newStatus: TStatus) => void
  /** Column add-card button */
  onAddCard?: (status: TStatus) => void
  loading?: boolean
  className?: string
}

// ─── Drag state ───────────────────────────────────────────────────────────────

interface DragState<T> {
  row: T
  fromStatus: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function KanbanView<T extends object, TStatus extends string = string>({
  data,
  rowKey,
  statusKey,
  columns,
  card,
  onStatusChange,
  onAddCard,
  loading,
  className,
}: KanbanViewProps<T, TStatus>) {
  const [dragging, setDragging] = useState<DragState<T> | null>(null)
  const [overCol, setOverCol] = useState<TStatus | null>(null)
  const dragCounter = useRef<Record<string, number>>({})

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={clsx('flex gap-4 overflow-x-auto pb-4', className)}>
        {columns.map(col => (
          <div key={col.key} className="w-72 shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6 ml-auto rounded-full" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ─── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (row: T) => {
    setDragging({ row, fromStatus: String(row[statusKey]) })
  }

  const handleDragEnter = (colKey: TStatus, e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current[colKey] = (dragCounter.current[colKey] ?? 0) + 1
    setOverCol(colKey)
  }

  const handleDragLeave = (colKey: TStatus) => {
    dragCounter.current[colKey] = Math.max((dragCounter.current[colKey] ?? 1) - 1, 0)
    if (dragCounter.current[colKey] === 0) setOverCol(null)
  }

  const handleDrop = (colKey: TStatus, e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current[colKey] = 0
    setOverCol(null)
    if (dragging && dragging.fromStatus !== colKey && onStatusChange) {
      onStatusChange(dragging.row, colKey)
    }
    setDragging(null)
  }

  const handleDragEnd = () => {
    setDragging(null)
    setOverCol(null)
    dragCounter.current = {}
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={clsx('flex gap-3 overflow-x-auto pb-4 items-start', className)}>
      {columns.map(col => {
        const colRows = data.filter(r => String(r[statusKey]) === col.key)
        const isOver = overCol === col.key && dragging?.fromStatus !== col.key
        const isOverLimit = col.limit !== undefined && colRows.length >= col.limit

        return (
          <div
            key={col.key}
            className={clsx(
              'flex flex-col rounded-xl border-2 transition-all duration-150 shrink-0',
              'w-[280px] sm:w-72',
              isOver
                ? 'border-primary-400 bg-primary-50/50 shadow-lg shadow-primary-100'
                : 'border-gray-200 bg-gray-50/80',
            )}
            onDragOver={e => e.preventDefault()}
            onDragEnter={e => handleDragEnter(col.key, e)}
            onDragLeave={() => handleDragLeave(col.key)}
            onDrop={e => handleDrop(col.key, e)}
          >
            {/* Column header */}
            <div className="px-3.5 pt-3.5 pb-2">
              <div className="flex items-center gap-2">
                {col.color && (
                  <span className={clsx('w-2.5 h-2.5 rounded-full shrink-0', col.color)} />
                )}
                <span className={clsx('text-sm font-semibold flex-1', col.textColor ?? 'text-gray-800')}>
                  {col.label}
                </span>
                <span className={clsx(
                  'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
                  isOverLimit ? 'bg-red-100 text-red-600' : 'bg-white border border-gray-200 text-gray-500',
                )}>
                  {colRows.length}{col.limit ? `/${col.limit}` : ''}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 px-2 pb-2 min-h-[80px]">
              {colRows.map(row => {
                const key = String(row[rowKey])
                const isDraggingThis = dragging && String(dragging.row[rowKey]) === key
                const actions = card.buildRowActions?.(row)

                return (
                  <div
                    key={key}
                    draggable={!!onStatusChange}
                    onDragStart={() => handleDragStart(row)}
                    onDragEnd={handleDragEnd}
                    onClick={card.onCardClick ? () => card.onCardClick!(row) : undefined}
                    className={clsx(
                      'group bg-white rounded-xl border border-gray-200 shadow-sm p-3.5',
                      'transition-all duration-150 select-none',
                      onStatusChange && 'cursor-grab active:cursor-grabbing',
                      card.onCardClick && !onStatusChange && 'cursor-pointer',
                      card.onCardClick && 'hover:border-primary-200 hover:shadow-md',
                      isDraggingThis && 'opacity-40 scale-95 rotate-1',
                    )}
                  >
                    {/* Card top row */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate leading-tight">
                          {card.renderTitle(row)}
                        </div>
                        {card.renderSubtitle && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate">
                            {card.renderSubtitle(row)}
                          </div>
                        )}
                      </div>
                      {card.renderValue && (
                        <div className="shrink-0 text-sm font-bold text-gray-700 tabular-nums">
                          {card.renderValue(row)}
                        </div>
                      )}
                      {actions && actions.length > 0 && (
                        <div
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          <Dropdown
                            trigger={
                              <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                <MoreHorizontal size={14} />
                              </button>
                            }
                            items={actions}
                            align="right"
                          />
                        </div>
                      )}
                    </div>

                    {/* Card meta */}
                    {card.renderMeta && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                        {card.renderMeta(row)}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Drop indicator when dragging */}
              {isOver && (
                <div className="rounded-xl border-2 border-dashed border-primary-300 bg-primary-50 h-16 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-400">Drop here</span>
                </div>
              )}
            </div>

            {/* Add card button */}
            {onAddCard && (
              <button
                onClick={() => onAddCard(col.key)}
                className="mx-2 mb-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
              >
                <Plus size={13} /> Add card
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
