/**
 * RetroProgressBar Component
 *
 * Retro/Pixel design progress bar used to show:
 * - Compliance percentage for job opportunities
 * - Task progress
 *
 * Features:
 * - 8-bit visual blocks
 * - Color-coded (red/yellow/green)
 * - Blocky animation (no smooth transitions)
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RetroProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
}

type ProgressColor = 'bg-red-600' | 'bg-yellow-500' | 'bg-green-600';

function getProgressColor(value: number): ProgressColor {
  if (value >= 75) return 'bg-green-600';
  if (value >= 50) return 'bg-yellow-500';
  return 'bg-red-600';
}

const RetroProgressBar = React.forwardRef<
  HTMLDivElement,
  RetroProgressBarProps
>(
  (
    {
      value,
      className,
      size = 'md',
      showLabel = false,
      showPercentage = true,
    },
    ref
  ) => {
    const normalizedValue = Math.min(Math.max(value, 0), 100);
    const color = getProgressColor(normalizedValue);

    const sizeClasses = {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-6',
    };

    return (
      <div className="w-full space-y-1" ref={ref}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-black">
              Progress
            </span>
            {showPercentage && (
              <span className="font-mono text-sm font-bold text-black">
                {normalizedValue}%
              </span>
            )}
          </div>
        )}

        {/* Outer border (retro style) */}
        <div
          className={cn(
            'w-full',
            'border-2 border-black',
            'bg-gray-200',
            'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            'overflow-hidden',
            sizeClasses[size],
            className
          )}
        >
          {/* Inner progress fill with blocky effect */}
          <div
            className={cn(
              'h-full transition-all duration-300',
              'flex items-center justify-center',
              color,
              // Create blocky effect with grid lines
              'shadow-inset'
            )}
            style={{
              width: `${normalizedValue}%`,
              // Create 8-bit block pattern
              backgroundImage:
                'linear-gradient(90deg, transparent 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: '4px 4px',
            }}
          />
        </div>

        {showPercentage && !showLabel && (
          <div className="text-right">
            <span className="font-mono text-xs font-bold text-black">
              {normalizedValue}%
            </span>
          </div>
        )}
      </div>
    );
  }
);
RetroProgressBar.displayName = 'RetroProgressBar';

export { RetroProgressBar };
