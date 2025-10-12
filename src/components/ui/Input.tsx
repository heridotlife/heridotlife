import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;

    const baseInputClasses = [
      // Base styles
      'block w-full',
      'text-base', // Prevents iOS zoom
      'rounded-lg',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'min-h-[44px]', // Touch target compliance
    ];

    // Variant styles
    const variantClasses = {
      default: [
        'border border-sky-200 dark:border-sky-700',
        'bg-white dark:bg-slate-900',
        'text-sky-900 dark:text-sky-100',
        'placeholder:text-sky-400 dark:placeholder:text-sky-500',
        'focus:ring-sky-500 focus:border-sky-500',
        error ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : '',
      ],
      filled: [
        'border-0',
        'bg-sky-50 dark:bg-slate-800',
        'text-sky-900 dark:text-sky-100',
        'placeholder:text-sky-400 dark:placeholder:text-sky-500',
        'focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900',
        error ? 'bg-red-50 dark:bg-red-900/20 focus:ring-red-500' : '',
      ],
    };

    // Padding based on icons
    const paddingClasses = [leftIcon ? 'pl-10' : 'px-4', rightIcon ? 'pr-10' : 'px-4', 'py-3'].join(
      ' '
    );

    const inputClasses = [
      ...baseInputClasses,
      ...variantClasses[variant],
      paddingClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={containerClasses}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-sky-700 dark:text-sky-300 mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-sky-400 dark:text-sky-500">{leftIcon}</div>
            </div>
          )}

          {/* Input */}
          <input ref={ref} id={inputId} className={inputClasses} {...props} />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-sky-400 dark:text-sky-500">{rightIcon}</div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-2 text-sm text-sky-600 dark:text-sky-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
