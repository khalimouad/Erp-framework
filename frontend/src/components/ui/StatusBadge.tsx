import { Badge } from '@/components/ui/Badge'

interface StatusBadgeProps {
  active: boolean
  size?: 'xs' | 'sm' | 'md'
}

export function StatusBadge({ active, size = 'xs' }: StatusBadgeProps) {
  return (
    <Badge color={active ? 'green' : 'gray'} size={size} dot>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
