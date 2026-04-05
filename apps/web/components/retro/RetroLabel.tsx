/**
 * RetroLabel Component
 *
 * Retro/Pixel design label used with:
 * - Form inputs
 * - Checkboxes
 * - Descriptions
 */

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const retroLabelVariants = cva(
  'font-mono font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      variant: {
        default: 'text-black',
        muted: 'text-gray-600',
        accent: 'text-blue-600',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface RetroLabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof retroLabelVariants> {}

const RetroLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  RetroLabelProps
>(({ className, size, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(retroLabelVariants({ size, variant, className }))}
    {...props}
  />
));
RetroLabel.displayName = LabelPrimitive.Root.displayName;

export { RetroLabel, retroLabelVariants };
