import type { ReactNode } from 'react'

interface TableCardProps {
  mobile: ReactNode
  desktop: ReactNode
}

/**
 * Standard list-page layout: responsive padding + white card that shows
 * a ResponsiveTable on mobile and an AdvancedTable on desktop.
 */
export function TableCard({ mobile, desktop }: TableCardProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="sm:hidden">{mobile}</div>
        <div className="hidden sm:block">{desktop}</div>
      </div>
    </div>
  )
}
