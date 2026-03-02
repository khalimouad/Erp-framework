/**
 * FormView — Odoo-style 2-column form.
 *
 * Usage:
 *   <FormView
 *     fields={fieldDefs}
 *     data={record}
 *     onChange={setRecord}
 *     readOnly={!isEditing}
 *   />
 *
 * Field types:
 *   text | number | email | phone | url | date | datetime
 *   select | multiselect | textarea | boolean | currency | computed | separator
 *
 * span={2} stretches a field across both columns.
 */

import clsx from 'clsx'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { FormFieldDef } from '@/types/ui'

// ─── helpers ─────────────────────────────────────────────────────────────────

function get(data: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k]
    return undefined
  }, data)
}

function set(
  data: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  return { ...data, [key]: value }
}

// ─── individual field ─────────────────────────────────────────────────────────

interface FieldProps {
  field: FormFieldDef
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  readOnly: boolean
}

function Field({ field, data, onChange, readOnly }: FieldProps) {
  const raw = field.type === 'computed'
    ? field.compute?.(data)
    : get(data, field.key)

  const value = raw ?? ''

  // ── READ-ONLY rendering ──────────────────────────────────────────────────
  if (readOnly || field.readOnly || field.type === 'computed') {
    let display: React.ReactNode = '—'

    if (value !== '' && value != null) {
      if (field.type === 'boolean') {
        display = value
          ? <span className="flex items-center gap-1 text-green-600"><Check size={14} /> Yes</span>
          : <span className="text-gray-400">No</span>
      } else if (field.type === 'select') {
        const opt = field.options?.find(o => o.value === value)
        display = opt
          ? (opt.color
            ? <Badge color={opt.color}>{opt.label}</Badge>
            : opt.label)
          : String(value)
      } else if (field.type === 'currency') {
        display = `${field.prefix ?? '$'}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      } else if (field.type === 'multiselect') {
        const vals = Array.isArray(value) ? value : []
        display = (
          <div className="flex flex-wrap gap-1">
            {vals.map(v => {
              const opt = field.options?.find(o => o.value === v)
              return <Badge key={v} color={opt?.color ?? 'gray'}>{opt?.label ?? v}</Badge>
            })}
          </div>
        )
      } else {
        display = String(value)
        if (field.suffix) display = `${display} ${field.suffix}`
      }
    }

    return (
      <div className="py-1">
        <div className="text-sm text-gray-900 min-h-[1.5rem]">{display}</div>
      </div>
    )
  }

  // ── EDIT rendering ───────────────────────────────────────────────────────
  const inputClass = clsx(
    'w-full rounded-lg border border-gray-300 text-sm text-gray-800',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'placeholder:text-gray-400',
    'disabled:bg-gray-50 disabled:text-gray-400',
  )

  if (field.type === 'textarea') {
    return (
      <textarea
        className={clsx(inputClass, 'px-3 py-2 resize-none')}
        rows={field.rows ?? 3}
        placeholder={field.placeholder}
        value={String(value)}
        onChange={e => onChange(field.key, e.target.value)}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select
        className={clsx(inputClass, 'px-3 py-2 h-9 bg-white')}
        value={String(value)}
        onChange={e => onChange(field.key, e.target.value)}
      >
        <option value="">{field.placeholder ?? 'Select…'}</option>
        {field.options?.map(o => (
          <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'multiselect') {
    const selected: unknown[] = Array.isArray(value) ? value : []
    return (
      <div className="border border-gray-300 rounded-lg p-2 space-y-1">
        {field.options?.map(o => (
          <label key={String(o.value)} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={selected.includes(o.value)}
              onChange={e => {
                const next = e.target.checked
                  ? [...selected, o.value]
                  : selected.filter(v => v !== o.value)
                onChange(field.key, next)
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer h-9">
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(field.key, !value)}
          className={clsx(
            'relative w-10 h-5 rounded-full transition-colors',
            value ? 'bg-primary-600' : 'bg-gray-300',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              value && 'translate-x-5',
            )}
          />
        </button>
        <span className="text-sm text-gray-700">{value ? 'Yes' : 'No'}</span>
      </label>
    )
  }

  // number, currency, text, email, phone, url, date, datetime
  const inputType =
    field.type === 'date'     ? 'date' :
    field.type === 'datetime' ? 'datetime-local' :
    field.type === 'email'    ? 'email' :
    field.type === 'phone'    ? 'tel' :
    field.type === 'url'      ? 'url' :
    (field.type === 'number' || field.type === 'currency') ? 'number' :
    'text'

  const hasAffix = !!(field.prefix || field.suffix)

  return (
    <div className={clsx(hasAffix && 'flex items-stretch')}>
      {field.prefix && (
        <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm text-gray-500">
          {field.prefix}
        </span>
      )}
      <input
        type={inputType}
        className={clsx(
          inputClass, 'px-3 py-2 h-9',
          hasAffix && !field.prefix && 'rounded-r-lg rounded-l-none',
          hasAffix && !field.suffix && 'rounded-l-lg rounded-r-none',
          hasAffix && field.prefix && field.suffix && 'rounded-none',
        )}
        placeholder={field.placeholder}
        value={String(value)}
        min={field.min}
        max={field.max}
        step={field.step ?? (field.type === 'currency' ? '0.01' : undefined)}
        onChange={e => onChange(field.key, e.target.value)}
      />
      {field.suffix && (
        <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-sm text-gray-500">
          {field.suffix}
        </span>
      )}
    </div>
  )
}

// ─── FormView ────────────────────────────────────────────────────────────────

interface FormViewProps {
  fields: FormFieldDef[]
  data: Record<string, unknown>
  onChange?: (data: Record<string, unknown>) => void
  readOnly?: boolean
  className?: string
}

export function FormView({ fields, data, onChange, readOnly = false, className }: FormViewProps) {
  const handleChange = (key: string, value: unknown) => {
    onChange?.(set(data, key, value))
  }

  return (
    <div className={clsx('grid grid-cols-2 gap-x-6 gap-y-4', className)}>
      {fields.map(field => {
        if (field.type === 'separator') {
          return (
            <div key={field.key} className="col-span-2">
              {field.label && (
                <div className="flex items-center gap-3 my-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {field.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={field.key}
            className={clsx(field.span === 2 && 'col-span-2')}
          >
            {/* Label */}
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {field.label}
              {field.required && !readOnly && (
                <span className="text-red-500 ml-0.5">*</span>
              )}
            </label>

            {/* Field */}
            <Field
              field={field}
              data={data}
              onChange={handleChange}
              readOnly={readOnly}
            />
          </div>
        )
      })}
    </div>
  )
}
