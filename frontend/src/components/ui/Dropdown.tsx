import { useRef, useState, useEffect, ReactNode } from 'react'
import clsx from 'clsx'

export interface DropdownItem {
  key: string
  label: string
  icon?: ReactNode
  variant?: 'default' | 'danger'
  separator?: boolean      // divider BEFORE this item
  disabled?: boolean
  onClick: () => void
  hidden?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  const visible = items.filter(i => !i.hidden)

  return (
    <div ref={ref} className={clsx('relative inline-block', className)}>
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>

      {open && (
        <div
          className={clsx(
            'absolute z-50 mt-1 min-w-[180px] bg-white rounded-xl border border-gray-200 shadow-lg py-1',
            'animate-in fade-in slide-in-from-top-2 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {visible.map(item => (
            <div key={item.key}>
              {item.separator && <div className="h-px bg-gray-100 my-1" />}
              <button
                disabled={item.disabled}
                onClick={() => { item.onClick(); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                {item.icon && <span className="shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
