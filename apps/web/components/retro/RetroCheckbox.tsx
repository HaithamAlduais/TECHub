/**
 * RetroCheckbox Component
 *
 * Retro/Pixel design checkbox with:
 * - Square shape (no rounded corners)
 * - Thick black borders
 * - Monospace label
 * - HTML native checkbox
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RetroCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const RetroCheckbox = React.forwardRef<HTMLInputElement, RetroCheckboxProps>(
  ({ className, label, description, checked, onCheckedChange, onChange, ...props }, ref) => (
    <div className="flex items-start gap-3">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        className={cn(
          // Base sizing
          'h-6 w-6 flex-shrink-0',
          // Retro styling
          'border-2 border-black bg-white',
          'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'cursor-pointer',
          // Interaction states
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'checked:bg-blue-600',
          'transition-all duration-100',
          className
        )}
        {...props}
      />

      {label && (
        <div className="flex flex-col gap-1">
          <label className="font-mono font-semibold text-sm text-black">
            {label}
          </label>
          {description && (
            <p className="font-mono text-xs text-gray-600">{description}</p>
          )}
        </div>
      )}
    </div>
  )
);

RetroCheckbox.displayName = 'RetroCheckbox';

export { RetroCheckbox, type RetroCheckboxProps };
