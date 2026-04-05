/**
 * RetroButton Component
 * 
 * Retro/Pixel design button with:
 * - Sharp square corners (no border-radius)
 * - Thick black borders (2px solid #000)
 * - Hard drop shadows (4px 4px 0px #000)
 * - Monospace typography
 * - Click animation (push-down effect)
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const retroButtonVariants = cva(
  cn(
    // Base styles
    'inline-flex items-center justify-center',
    'font-mono font-semibold',
    'px-4 py-2',
    'cursor-pointer',
    'transition-all duration-75',
    'active:translate-x-1 active:translate-y-1 active:shadow-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Retro border and shadow
    'border-2 border-black',
    'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-white text-black hover:bg-gray-100',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        outline:
          'bg-white text-black border-black hover:bg-black hover:text-white',
      },
      size: {
        sm: 'text-xs px-3 py-1',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
        xl: 'text-xl px-8 py-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface RetroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof retroButtonVariants> {
  asChild?: boolean;
}

const RetroButton = React.forwardRef<HTMLButtonElement, RetroButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(retroButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
RetroButton.displayName = 'RetroButton';

export { RetroButton, retroButtonVariants };
