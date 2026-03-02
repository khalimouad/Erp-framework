import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface FormSectionProps {
  title: string
  subtitle?: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  /** Right-side slot (e.g. a small action button) */
  extra?: ReactNode
}

export function FormSection({
  title,
  subtitle,
  collapsible = false,
  defaultOpen = true,
  children,
  className,
  extra,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={clsx('border border-gray-200 rounded-xl overflow-hidden', className)}>
      {/* Section header */}
      <div
        className={clsx(
          'flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200',
          collapsible && 'cursor-pointer select-none hover:bg-gray-100 transition-colors',
        )}
        onClick={() => collapsible && setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <span className="text-gray-400">
              {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </span>
          )}
          <div>
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {extra && <div onClick={e => e.stopPropagation()}>{extra}</div>}
      </div>

      {/* Section body */}
      {open && <div className="p-5 bg-white">{children}</div>}
    </div>
  )
}
