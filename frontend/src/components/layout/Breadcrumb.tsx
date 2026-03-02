import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { BreadcrumbItem } from '@/types/ui'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-0.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRight size={14} className="text-gray-400 shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
