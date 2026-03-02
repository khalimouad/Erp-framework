import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const variantMap: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700 shadow-sm',
  secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 shadow-sm',
  ghost:     'bg-transparent text-gray-600 border-transparent hover:bg-gray-100',
  danger:    'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm',
  warning:   'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm',
  link:      'bg-transparent text-primary-600 border-transparent hover:underline p-0',
}

const sizeMap: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, icon, iconRight, children, className, disabled, fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
})
