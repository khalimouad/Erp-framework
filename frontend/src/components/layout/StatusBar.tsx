import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { StatusStage } from '@/types/ui'

interface StatusBarProps {
  stages: StatusStage[]
  current: string
  onChange?: (key: string) => void
  readonly?: boolean
}

export function StatusBar({ stages, current, onChange, readonly }: StatusBarProps) {
  const currentIdx = stages.findIndex(s => s.key === current)

  return (
    <div className="flex items-center gap-0 select-none">
      {stages.map((stage, i) => {
        const isPast    = i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture  = i > currentIdx
        const isLast    = i === stages.length - 1

        return (
          <button
            key={stage.key}
            disabled={readonly}
            onClick={() => onChange?.(stage.key)}
            className={clsx(
              'relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold',
              'transition-colors focus-visible:outline-none',
              !isLast && [
                'pr-6',
                // right-pointing arrow via clip-path
                'clip-arrow',
              ],
              isPast    && 'bg-primary-100 text-primary-700 hover:bg-primary-200',
              isCurrent && 'bg-primary-600 text-white',
              isFuture  && 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              readonly  && 'cursor-default',
              !readonly && 'cursor-pointer',
              i === 0 && 'rounded-l-full',
              isLast   && 'rounded-r-full',
            )}
            style={{
              clipPath: !isLast
                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                : undefined,
              zIndex: stages.length - i,
            }}
          >
            {isPast && <Check size={10} />}
            {stage.label}
          </button>
        )
      })}
    </div>
  )
}
