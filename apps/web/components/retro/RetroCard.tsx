/**
 * RetroCard Component
 *
 * Retro/Pixel design card with:
 * - Sharp square corners
 * - Thick black borders (2px)
 * - Hard drop shadows
 * - Clean white background
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RetroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
  clickable?: boolean;
}

const RetroCard = React.forwardRef<HTMLDivElement, RetroCardProps>(
  ({ className, highlighted = false, clickable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        'bg-white',
        'border-2 border-black',
        'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        'p-4',
        // Retro feel
        'font-mono',
        // Optional highlighted box
        highlighted && 'border-4 border-yellow-400 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]',
        // Optional clickable effect
        clickable &&
          'cursor-pointer transition-all duration-75 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        className
      )}
      {...props}
    />
  )
);
RetroCard.displayName = 'RetroCard';

export { RetroCard };
