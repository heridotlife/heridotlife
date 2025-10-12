import { forwardRef } from 'react';
import type { LucideIcon } from './icons';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center',
      'font-medium rounded-lg',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'min-h-[44px]', // Touch target compliance
    ];

    // Size variants
    const sizeClasses = {
      sm: ['px-3 py-2', 'text-sm', 'min-w-[44px]'],
      md: ['px-4 py-2.5', 'text-base', 'min-w-[44px]'],
      lg: ['px-6 py-3', 'text-lg', 'min-w-[44px]'],
    };

    // Color variants
    const variantClasses = {
      primary: [
        'bg-gradient-to-r from-sky-500 to-cyan-500',
        'dark:from-sky-600 dark:to-cyan-600',
        'text-white',
        'shadow-md hover:shadow-lg',
        'hover:from-sky-600 hover:to-cyan-600',
        'dark:hover:from-sky-700 dark:hover:to-cyan-700',
        'focus:ring-sky-500',
      ],
      secondary: [
        'bg-sky-100 dark:bg-sky-900',
        'text-sky-700 dark:text-sky-300',
        'hover:bg-sky-200 dark:hover:bg-sky-800',
        'focus:ring-sky-500',
      ],
      outline: [
        'border border-sky-300 dark:border-sky-700',
        'text-sky-700 dark:text-sky-300',
        'hover:bg-sky-50 dark:hover:bg-slate-700',
        'focus:ring-sky-500',
      ],
      ghost: [
        'text-sky-600 dark:text-sky-400',
        'hover:bg-sky-100 dark:hover:bg-sky-900/50',
        'focus:ring-sky-500',
      ],
      danger: [
        'bg-gradient-to-r from-red-500 to-red-600',
        'dark:from-red-600 dark:to-red-700',
        'text-white',
        'shadow-md hover:shadow-lg',
        'hover:from-red-600 hover:to-red-700',
        'dark:hover:from-red-700 dark:hover:to-red-800',
        'focus:ring-red-500',
      ],
    };

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Combine all classes
    const classes = [
      ...baseClasses,
      ...sizeClasses[size],
      ...variantClasses[variant],
      widthClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSize = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? (
          <>
            <svg
              className={`animate-spin -ml-1 mr-2 ${iconSize}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {children}
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={`${iconSize} ${children ? 'mr-2' : ''}`} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={`${iconSize} ${children ? 'ml-2' : ''}`} />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
