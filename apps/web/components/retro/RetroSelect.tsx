/**
 * RetroSelect Component
 *
 * Retro/Pixel design select dropdown with:
 * - Sharp square corners
 * - Thick black borders
 * - Retro styled options
 * - Monospace font
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RetroSelectOption {
  value: string;
  label: string;
}

export interface RetroSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: RetroSelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
}

const RetroSelect = React.forwardRef<HTMLSelectElement, RetroSelectProps>(
  ({ className, options, error, label, placeholder, ...props }, ref) => (
    <div className="w-full space-y-1">
      {label && (
        <label className="font-mono font-semibold text-sm text-black">
          {label}
        </label>
      )}

      <select
        className={cn(
          // Base styles
          'w-full',
          'font-mono text-base',
          'px-4 py-2',
          'bg-white text-black',
          // Retro border
          'border-2 border-black',
          'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Error state
          error && 'border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled selected>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);
RetroSelect.displayName = 'RetroSelect';

export { RetroSelect };
