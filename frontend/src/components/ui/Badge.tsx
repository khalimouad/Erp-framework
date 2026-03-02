import clsx from 'clsx'
import type { BadgeColor } from '@/types/ui'

const colorMap: Record<BadgeColor, string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200 ring-blue-200',
  green:  'bg-green-50 text-green-700 border-green-200 ring-green-200',
  red:    'bg-red-50 text-red-700 border-red-200 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-200',
  gray:   'bg-gray-100 text-gray-600 border-gray-200 ring-gray-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-200',
  teal:   'bg-teal-50 text-teal-700 border-teal-200 ring-teal-200',
  pink:   'bg-pink-50 text-pink-700 border-pink-200 ring-pink-200',
}

interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
  dot?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function Badge({ color = 'gray', children, dot, size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        size === 'xs' && 'px-1.5 py-0 text-xs',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        colorMap[color],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  )
}
