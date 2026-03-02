/**
 * LinesTable — Odoo-style editable inline lines.
 *
 * Used for: order lines, stock move lines, BOM lines, invoice lines, etc.
 *
 * Features:
 *  ✓ Inline cell editing (click to edit)
 *  ✓ Computed columns (auto-recalculate on row change)
 *  ✓ Add / delete rows
 *  ✓ Move rows up / down
 *  ✓ Footer row with sum / avg / count aggregation
 *  ✓ Keyboard navigation (Tab to next cell, Enter to next row)
 *  ✓ Column types: text, number, currency, select, date, boolean
 */

import { useState, useRef, KeyboardEvent } from 'react'
import clsx from 'clsx'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { LineColumnDef } from '@/types/ui'

// ─── helpers ─────────────────────────────────────────────────────────────────

function newRow(): Record<string, unknown> {
  return { _id: Math.random().toString(36).slice(2) }
}

function computeRow(
  row: Record<string, unknown>,
  columns: LineColumnDef[],
): Record<string, unknown> {
  const computed = { ...row }
  columns.forEach(col => {
    if (col.type === 'computed' && col.compute) {
      computed[col.key] = col.compute(computed)
    }
  })
  return computed
}

function formatFooter(
  rows: Record<string, unknown>[],
  col: LineColumnDef,
): string | null {
  if (!col.footer) return null
  if (typeof col.footer === 'function') return String(col.footer(rows))

  const nums = rows
    .map(r => Number(r[col.key] ?? 0))
    .filter(n => !isNaN(n))

  if (nums.length === 0) return '—'

  switch (col.footer) {
    case 'sum':
      return (col.type === 'currency' ? '$' : '') +
        nums.reduce((a, b) => a + b, 0)
             .toLocaleString(undefined, { minimumFractionDigits: col.type === 'currency' ? 2 : 0 })
    case 'avg':
      return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
    case 'count':
      return String(nums.length)
    default:
      return null
  }
}

// ─── Cell editor ─────────────────────────────────────────────────────────────

interface CellEditorProps {
  col: LineColumnDef
  value: unknown
  onChange: (v: unknown) => void
  onNext: () => void
  onPrev: () => void
}

function CellEditor({ col, value, onChange, onNext, onPrev }: CellEditorProps) {
  const inputClass = clsx(
    'w-full h-8 px-2 py-1 text-sm border-0 outline-none',
    'focus:ring-2 focus:ring-primary-500 rounded-md bg-white',
  )

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      e.shiftKey ? onPrev() : onNext()
    }
    if (e.key === 'Enter') { e.preventDefault(); onNext() }
  }

  if (col.type === 'select') {
    return (
      <select
        className={clsx(inputClass, 'bg-white')}
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
      >
        <option value="">—</option>
        {col.options?.map(o => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    )
  }

  if (col.type === 'boolean') {
    return (
      <label className="flex items-center justify-center h-8 cursor-pointer">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          onKeyDown={handleKey}
          autoFocus
        />
      </label>
    )
  }

  const inputType =
    col.type === 'date'                    ? 'date' :
    (col.type === 'number' ||
     col.type === 'currency')              ? 'number' :
    'text'

  return (
    <input
      type={inputType}
      className={inputClass}
      value={String(value ?? '')}
      step={col.type === 'currency' ? '0.01' : undefined}
      onChange={e => onChange(e.target.value)}
      onKeyDown={handleKey}
      autoFocus
    />
  )
}

// ─── Cell display ─────────────────────────────────────────────────────────────

function CellDisplay({ col, value }: { col: LineColumnDef; value: unknown }) {
  if (value == null || value === '') return <span className="text-gray-300">—</span>

  if (col.type === 'currency') {
    return <span>${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  }
  if (col.type === 'number') {
    return <span>{Number(value).toLocaleString()}</span>
  }
  if (col.type === 'boolean') {
    return value
      ? <span className="text-green-600">✓</span>
      : <span className="text-gray-300">—</span>
  }
  if (col.type === 'select') {
    const opt = col.options?.find(o => String(o.value) === String(value))
    return <span>{opt?.label ?? String(value)}</span>
  }
  return <span className="truncate">{String(value)}</span>
}

// ─── LinesTable ──────────────────────────────────────────────────────────────

interface LinesTableProps {
  columns: LineColumnDef[]
  rows: Record<string, unknown>[]
  onChange: (rows: Record<string, unknown>[]) => void
  readOnly?: boolean
  addLabel?: string
  className?: string
  /** Show move-up/down handles */
  sortable?: boolean
  /** Minimum rows (can't delete below this) */
  minRows?: number
}

export function LinesTable({
  columns,
  rows,
  onChange,
  readOnly = false,
  addLabel = 'Add a line',
  className,
  sortable = false,
  minRows = 0,
}: LinesTableProps) {
  // [rowIdx, colKey] of the currently active cell
  const [activeCell, setActiveCell] = useState<[number, string] | null>(null)

  const editableCols = columns.filter(c => c.editable && c.type !== 'computed')

  // ── mutations ─────────────────────────────────────────────────────────────
  const updateCell = (rowIdx: number, key: string, value: unknown) => {
    const updated = rows.map((row, i) => {
      if (i !== rowIdx) return row
      const next = computeRow({ ...row, [key]: value }, columns)
      return next
    })
    onChange(updated)
  }

  const addRow = () => {
    const emptyRow = computeRow(newRow(), columns)
    onChange([...rows, emptyRow])
    // activate first editable cell of new row
    const firstEditable = columns.find(c => c.editable && c.type !== 'computed')
    if (firstEditable) {
      setTimeout(() => setActiveCell([rows.length, firstEditable.key]), 50)
    }
  }

  const deleteRow = (idx: number) => {
    if (rows.length <= minRows) return
    onChange(rows.filter((_, i) => i !== idx))
    setActiveCell(null)
  }

  const moveRow = (idx: number, dir: 1 | -1) => {
    const target = idx + dir
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  // ── keyboard navigation ───────────────────────────────────────────────────
  const navigate = (rowIdx: number, colKey: string, forward: boolean) => {
    const colIdx = editableCols.findIndex(c => c.key === colKey)
    const nextColIdx = forward ? colIdx + 1 : colIdx - 1

    if (nextColIdx >= 0 && nextColIdx < editableCols.length) {
      setActiveCell([rowIdx, editableCols[nextColIdx].key])
    } else if (forward && rowIdx < rows.length - 1) {
      setActiveCell([rowIdx + 1, editableCols[0]?.key ?? colKey])
    } else if (!forward && rowIdx > 0) {
      setActiveCell([rowIdx - 1, editableCols[editableCols.length - 1]?.key ?? colKey])
    } else {
      setActiveCell(null)
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className={clsx('border border-gray-200 rounded-xl overflow-hidden', className)}>
      <table className="w-full text-sm">
        {/* Head */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {(sortable || !readOnly) && <th className="w-8" />}
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(
                  'px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                  col.align === 'right'  && 'text-right',
                  col.align === 'center' && 'text-center',
                )}
              >
                {col.label}
                {col.required && !readOnly && <span className="text-red-400 ml-0.5">*</span>}
              </th>
            ))}
            {!readOnly && <th className="w-10" />}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (readOnly ? 0 : 2) + (sortable ? 1 : 0)}
                className="px-4 py-8 text-center text-sm text-gray-400"
              >
                No lines yet — {readOnly ? 'nothing to show.' : 'click "Add a line" below.'}
              </td>
            </tr>
          )}

          {rows.map((row, rowIdx) => (
            <tr
              key={String(row._id ?? rowIdx)}
              className={clsx(
                'bg-white hover:bg-gray-50 transition-colors group',
                activeCell?.[0] === rowIdx && 'bg-blue-50 hover:bg-blue-50',
              )}
            >
              {/* Move handles */}
              {(sortable || !readOnly) && (
                <td className="px-1 py-2 w-8">
                  {sortable && !readOnly && (
                    <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveRow(rowIdx, -1)}
                        disabled={rowIdx === 0}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveRow(rowIdx, 1)}
                        disabled={rowIdx === rows.length - 1}
                        className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  )}
                </td>
              )}

              {/* Data cells */}
              {columns.map(col => {
                const isActive = !readOnly && col.editable &&
                  activeCell?.[0] === rowIdx && activeCell?.[1] === col.key
                const isComputed = col.type === 'computed'
                const value = isComputed && col.compute
                  ? col.compute(row)
                  : row[col.key]

                return (
                  <td
                    key={col.key}
                    style={{ width: col.width }}
                    className={clsx(
                      'px-3 py-2',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      !readOnly && col.editable && !isComputed && 'cursor-text',
                      isActive && 'p-0.5',
                    )}
                    onClick={() => {
                      if (!readOnly && col.editable && !isComputed) {
                        setActiveCell([rowIdx, col.key])
                      }
                    }}
                  >
                    {isActive ? (
                      <CellEditor
                        col={col}
                        value={value}
                        onChange={v => updateCell(rowIdx, col.key, v)}
                        onNext={() => navigate(rowIdx, col.key, true)}
                        onPrev={() => navigate(rowIdx, col.key, false)}
                      />
                    ) : (
                      <CellDisplay col={col} value={value} />
                    )}
                  </td>
                )
              })}

              {/* Delete button */}
              {!readOnly && (
                <td className="px-2 py-2 text-right">
                  <button
                    onClick={() => deleteRow(rowIdx)}
                    disabled={rows.length <= minRows}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50
                               transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>

        {/* Footer (aggregations) */}
        {columns.some(c => c.footer) && (
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              {(sortable || !readOnly) && <td />}
              {columns.map(col => {
                const footerVal = formatFooter(rows, col)
                return (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-3 py-2.5 text-sm font-semibold text-gray-700',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {footerVal}
                  </td>
                )
              })}
              {!readOnly && <td />}
            </tr>
          </tfoot>
        )}
      </table>

      {/* Add row button */}
      {!readOnly && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addRow}
            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          >
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
