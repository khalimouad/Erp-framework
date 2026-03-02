import type { ReactNode } from 'react'

// ─── Badge ────────────────────────────────────────────────────────────────────
export type BadgeColor =
  | 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  | 'orange' | 'gray' | 'indigo' | 'teal' | 'pink'

// ─── Actions ──────────────────────────────────────────────────────────────────
export interface ActionDef {
  key: string
  label: string
  icon?: ReactNode
  /** Only used for buttons in ActionBar, not in the "More" dropdown */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  /** Render a separator line above this item (dropdown only) */
  separator?: boolean
  hidden?: boolean
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  label: string
  href?: string
}

// ─── Status bar ───────────────────────────────────────────────────────────────
export interface StatusStage {
  key: string
  label: string
  color?: BadgeColor
}

// ─── Advanced Table ───────────────────────────────────────────────────────────
export interface ColumnDef<T = Record<string, unknown>> {
  key: string
  label: string
  /**
   * Built-in renderers. Set `render` for full custom control.
   * badge  → uses badgeMap to map value to a BadgeColor
   * currency → formats as money
   * boolean → check/x icon
   */
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'badge' | 'boolean' | 'custom'
  sortable?: boolean
  filterable?: boolean
  /** Include in global keyword search */
  searchable?: boolean
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  /** Custom renderer — takes precedence over `type` */
  render?: (row: T) => ReactNode
  /** Maps value → badge color (type='badge') */
  badgeMap?: Record<string, BadgeColor>
  currencySymbol?: string
  hidden?: boolean
}

export interface RowAction<T = Record<string, unknown>> {
  key: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'danger'
  onClick: (row: T) => void
  hidden?: (row: T) => boolean
}

export interface BulkAction<T = Record<string, unknown>> {
  key: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'danger'
  onClick: (rows: T[]) => void
}

// ─── Form view ────────────────────────────────────────────────────────────────
export type FormFieldType =
  | 'text' | 'number' | 'email' | 'phone' | 'url'
  | 'date' | 'datetime'
  | 'select' | 'multiselect'
  | 'textarea'
  | 'boolean'
  | 'currency'
  | 'computed'
  | 'separator'

export interface FormFieldDef {
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  /** 1 = one column (default), 2 = full width */
  span?: 1 | 2
  options?: { value: string | number; label: string; color?: BadgeColor }[]
  readOnly?: boolean
  placeholder?: string
  suffix?: string
  prefix?: string
  /** Rows for textarea */
  rows?: number
  /** For type='computed' */
  compute?: (data: Record<string, unknown>) => unknown
  min?: number
  max?: number
  step?: number
}

// ─── Lines table ──────────────────────────────────────────────────────────────
export type LineColumnType = 'text' | 'number' | 'currency' | 'select' | 'date' | 'computed' | 'boolean'

export interface LineColumnDef {
  key: string
  label: string
  type?: LineColumnType
  editable?: boolean
  width?: string
  required?: boolean
  options?: { value: string | number; label: string }[]
  /** For type='computed' — derives value from the row */
  compute?: (row: Record<string, unknown>) => unknown
  align?: 'left' | 'center' | 'right'
  /** Footer aggregation */
  footer?: 'sum' | 'avg' | 'count' | ((rows: Record<string, unknown>[]) => string | number)
}
