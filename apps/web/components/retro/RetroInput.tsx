/**
 * RetroInput Component
 *
 * Retro/Pixel design input field with:
 * - Sharp square corners
 * - Thick black borders (2px)
 * - Monospace font
 * - Clean white background
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RetroInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const RetroInput = React.forwardRef<HTMLInputElement, RetroInputProps>(
  ({ className, type, error, label, ...props }, ref) => (
    <div className="w-full space-y-1">
      {label && (
        <label className="font-mono font-semibold text-sm text-black">
          {label}
        </label>
      )}

      <input
        type={type}
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
          // Placeholder
          'placeholder:text-gray-500',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Error state
          error && 'border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]',
          className
        )}
        ref={ref}
        {...props}
      />

      {error && (
        <p className="font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  )
);
RetroInput.displayName = 'RetroInput';

export { RetroInput };
