import { useState, ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'

// ─── Pill (single read-only tag) ─────────────────────────────────────────────

export type PillColor =
  | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'
  | 'indigo' | 'pink' | 'teal' | 'gray' | 'cyan' | 'rose'

const colorMap: Record<PillColor, string> = {
  blue:   'bg-blue-100   text-blue-700   border-blue-200',
  green:  'bg-green-100  text-green-700  border-green-200',
  red:    'bg-red-100    text-red-700    border-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  pink:   'bg-pink-100   text-pink-700   border-pink-200',
  teal:   'bg-teal-100   text-teal-700   border-teal-200',
  gray:   'bg-gray-100   text-gray-600   border-gray-200',
  cyan:   'bg-cyan-100   text-cyan-700   border-cyan-200',
  rose:   'bg-rose-100   text-rose-700   border-rose-200',
}

const sizeMap = {
  xs: 'text-[10px] px-1.5 py-0 leading-4 rounded',
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-lg',
  lg: 'text-sm px-3 py-1.5 rounded-xl',
}

interface PillProps {
  color?: PillColor
  size?: keyof typeof sizeMap
  icon?: ReactNode
  onRemove?: () => void
  onClick?: () => void
  active?: boolean
  children: ReactNode
  className?: string
}

export function Pill({
  color = 'gray',
  size = 'sm',
  icon,
  onRemove,
  onClick,
  active,
  children,
  className,
}: PillProps) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      className={clsx(
        'inline-flex items-center gap-1 font-medium border transition-all select-none',
        sizeMap[size],
        colorMap[color],
        onClick && 'cursor-pointer hover:brightness-95 active:scale-95',
        active && 'ring-2 ring-offset-1 ring-current',
        className,
      )}
    >
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="shrink-0 ml-0.5 -mr-0.5 opacity-60 hover:opacity-100 transition-opacity rounded-full hover:bg-black/10 p-0.5"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}

// ─── PillGroup (horizontal scroll list of pills) ──────────────────────────────

interface PillGroupProps {
  pills: { key: string; label: string; color?: PillColor; icon?: ReactNode }[]
  onRemove?: (key: string) => void
  size?: keyof typeof sizeMap
  wrap?: boolean
  className?: string
}

export function PillGroup({ pills, onRemove, size = 'sm', wrap = true, className }: PillGroupProps) {
  return (
    <div className={clsx('flex gap-1.5', wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto no-scrollbar', className)}>
      {pills.map(p => (
        <Pill
          key={p.key}
          color={p.color ?? 'gray'}
          size={size}
          icon={p.icon}
          onRemove={onRemove ? () => onRemove(p.key) : undefined}
        >
          {p.label}
        </Pill>
      ))}
    </div>
  )
}

// ─── FilterPills (tab-style horizontal filter bar) ───────────────────────────

interface FilterPillOption<T extends string = string> {
  value: T
  label: string
  count?: number
  color?: PillColor
}

interface FilterPillsProps<T extends string = string> {
  options: FilterPillOption<T>[]
  value: T | null
  onChange: (v: T | null) => void
  allLabel?: string
  size?: keyof typeof sizeMap
  className?: string
}

export function FilterPills<T extends string = string>({
  options,
  value,
  onChange,
  allLabel = 'All',
  size = 'sm',
  className,
}: FilterPillsProps<T>) {
  return (
    <div className={clsx('flex gap-1.5 flex-wrap', className)}>
      {/* All */}
      <Pill
        color={value === null ? 'blue' : 'gray'}
        size={size}
        active={value === null}
        onClick={() => onChange(null)}
      >
        {allLabel}
      </Pill>
      {options.map(opt => {
        const isActive = value === opt.value
        return (
          <Pill
            key={opt.value}
            color={isActive ? (opt.color ?? 'blue') : 'gray'}
            size={size}
            active={isActive}
            onClick={() => onChange(isActive ? null : opt.value)}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="ml-1 opacity-60 tabular-nums">{opt.count}</span>
            )}
          </Pill>
        )
      })}
    </div>
  )
}

// ─── PillInput (tag input — type to add, click x to remove) ──────────────────

interface PillInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  color?: PillColor
  className?: string
}

export function PillInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
  color = 'blue',
  className,
}: PillInputProps) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  const remove = (t: string) => onChange(tags.filter(x => x !== t))

  return (
    <div
      className={clsx(
        'flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-lg border border-gray-300 px-2.5 py-1.5',
        'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all',
        className,
      )}
    >
      {tags.map(t => (
        <Pill key={t} color={color} size="sm" onRemove={() => remove(t)}>
          {t}
        </Pill>
      ))}
      <input
        type="text"
        value={input}
        placeholder={tags.length === 0 ? placeholder : ''}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
          if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1])
        }}
        onBlur={add}
        className="flex-1 min-w-[80px] text-sm outline-none bg-transparent placeholder-gray-400"
      />
    </div>
  )
}
