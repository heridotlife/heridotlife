import { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-xl',
      'transition-all duration-300',
    ];

    // Variant styles
    const variantClasses = {
      default: [
        'bg-white/80 dark:bg-slate-800/80',
        'backdrop-blur-sm',
        'border border-sky-200 dark:border-sky-700',
        'shadow-lg',
      ],
      elevated: [
        'bg-white dark:bg-slate-800',
        'shadow-xl',
        'border border-sky-100 dark:border-sky-900',
      ],
      outlined: [
        'bg-white dark:bg-slate-800',
        'border-2 border-sky-300 dark:border-sky-700',
        'shadow-sm',
      ],
      filled: [
        'bg-sky-50 dark:bg-slate-700',
        'border border-sky-200 dark:border-sky-600',
        'shadow-sm',
      ],
    };

    // Padding variants
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    // Interactive states
    const interactiveClasses = [];
    
    if (hoverable || clickable) {
      interactiveClasses.push(
        'hover:shadow-xl',
        'hover:-translate-y-1',
        variant === 'default' && 'hover:border-sky-300 dark:hover:border-sky-600',
        variant === 'elevated' && 'hover:shadow-2xl',
        variant === 'outlined' && 'hover:border-sky-400 dark:hover:border-sky-600',
        variant === 'filled' && 'hover:bg-sky-100 dark:hover:bg-slate-600'
      );
    }

    if (clickable) {
      interactiveClasses.push(
        'cursor-pointer',
        'active:translate-y-0',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2',
        'min-h-[44px]' // Touch target compliance for clickable cards
      );
    }

    const classes = [
      ...baseClasses,
      ...variantClasses[variant],
      paddingClasses[padding],
      ...interactiveClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (clickable) {
      return (
        <button ref={ref as React.ForwardedRef<HTMLButtonElement>} className={classes} {...props as React.ButtonHTMLAttributes<HTMLButtonElement>}>
          {children}
        </button>
      );
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for better structure
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`text-slate-600 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-4 pt-4 border-t border-sky-200 dark:border-sky-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export default Card;
export { CardHeader, CardTitle, CardContent, CardFooter };