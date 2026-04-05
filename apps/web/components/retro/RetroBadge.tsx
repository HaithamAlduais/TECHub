/**
 * RetroBadge Component
 *
 * Retro/Pixel design badge/tag used for:
 * - Skills (verified/unverified)
 * - Categories
 * - Employment types
 * - Work types
 *
 * Features:
 * - Retro styling
 * - Multiple variants (verified, unverified, category, warning)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RetroBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'verified'
    | 'unverified'
    | 'category'
    | 'warning'
    | 'success'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const RetroBadge = React.forwardRef<HTMLSpanElement, RetroBadgeProps>(
  ({ className, variant = 'category', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-2',
    };

    const variantClasses = {
      verified:
        'bg-green-100 text-green-800 border-2 border-green-600 shadow-[2px_2px_0px_0px_rgba(22,163,74,1)]',
      unverified:
        'bg-gray-100 text-gray-800 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(107,114,128,1)]',
      category:
        'bg-blue-100 text-blue-800 border-2 border-blue-600 shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]',
      warning:
        'bg-yellow-100 text-yellow-800 border-2 border-yellow-600 shadow-[2px_2px_0px_0px_rgba(202,138,4,1)]',
      success:
        'bg-green-100 text-green-800 border-2 border-green-600 shadow-[2px_2px_0px_0px_rgba(22,163,74,1)]',
      danger:
        'bg-red-100 text-red-800 border-2 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center gap-1',
          'font-mono font-semibold',
          'whitespace-nowrap',
          'rounded-none', // NO border radius for retro
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
RetroBadge.displayName = 'RetroBadge';

export { RetroBadge };
