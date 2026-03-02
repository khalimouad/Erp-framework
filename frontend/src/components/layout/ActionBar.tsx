import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import type { ActionDef } from '@/types/ui'

interface ActionBarProps {
  /** Buttons rendered directly (left to right) */
  actions?: ActionDef[]
  /** Actions in the "⋮ More" dropdown */
  moreActions?: ActionDef[]
}

export function ActionBar({ actions = [], moreActions = [] }: ActionBarProps) {
  const visibleActions  = actions.filter(a => !a.hidden)
  const visibleMore     = moreActions.filter(a => !a.hidden)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleActions.map(action => (
        <Button
          key={action.key}
          variant={action.variant ?? 'secondary'}
          size="sm"
          icon={action.icon}
          loading={action.loading}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}

      {visibleMore.length > 0 && (
        <Dropdown
          align="right"
          trigger={
            <Button variant="ghost" size="sm" icon={<MoreHorizontal size={16} />}>
              Actions
            </Button>
          }
          items={visibleMore.map(a => ({
            key: a.key,
            label: a.label,
            icon: a.icon,
            variant: a.variant === 'danger' ? 'danger' : 'default',
            separator: a.separator,
            disabled: a.disabled,
            onClick: a.onClick,
          }))}
        />
      )}
    </div>
  )
}
