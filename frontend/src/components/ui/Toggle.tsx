import clsx from 'clsx'

type ToggleSize = 'sm' | 'md' | 'lg'

const trackSize: Record<ToggleSize, string> = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
  lg: 'h-6 w-11',
}
const thumbSize: Record<ToggleSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4.5 w-4.5',
}
const thumbTranslate: Record<ToggleSize, string> = {
  sm: 'translate-x-3.5',
  md: 'translate-x-4',
  lg: 'translate-x-5',
}
const thumbOffset: Record<ToggleSize, string> = {
  sm: 'top-0.5 left-0.5',
  md: 'top-[3px] left-[3px]',
  lg: 'top-[3px] left-[3px]',
}

export type ToggleColor = 'blue' | 'green' | 'violet' | 'orange' | 'red'

const trackColor: Record<ToggleColor, string> = {
  blue:   'peer-checked:bg-blue-600',
  green:  'peer-checked:bg-green-500',
  violet: 'peer-checked:bg-violet-600',
  orange: 'peer-checked:bg-orange-500',
  red:    'peer-checked:bg-red-500',
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  size?: ToggleSize
  color?: ToggleColor
  disabled?: boolean
  labelLeft?: boolean
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  color = 'blue',
  disabled = false,
  labelLeft = false,
}: ToggleProps) {
  const id = `toggle-${Math.random().toString(36).slice(2)}`

  const track = (
    <label
      htmlFor={id}
      className={clsx(
        'relative inline-block shrink-0 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      {/* Track */}
      <span
        className={clsx(
          'block rounded-full bg-gray-200 transition-colors duration-200',
          trackSize[size],
          trackColor[color],
        )}
      />
      {/* Thumb */}
      <span
        className={clsx(
          'absolute rounded-full bg-white shadow-sm transition-transform duration-200',
          'peer-checked:' + thumbTranslate[size],
          thumbSize[size],
          thumbOffset[size],
        )}
      />
    </label>
  )

  if (!label && !description) return track

  return (
    <div
      className={clsx(
        'flex items-start gap-3',
        labelLeft && 'flex-row-reverse justify-end',
        disabled && 'opacity-50',
      )}
    >
      {track}
      <div className="min-w-0">
        {label && (
          <p className="text-sm font-medium text-gray-800 leading-none">{label}</p>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
    </div>
  )
}
