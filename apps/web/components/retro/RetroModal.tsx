/**
 * RetroModal Component
 *
 * Retro/Pixel design modal dialog for:
 * - Job opportunity details
 * - Gates and confirmation dialogs
 *
 * Features:
 * - Retro styling with borders and shadows
 * - Close button
 * - Title and content areas
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const RetroModal = DialogPrimitive.Root;
const RetroModalTrigger = DialogPrimitive.Trigger;

const RetroModalClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-4 top-4',
      'inline-flex items-center justify-center',
      'h-8 w-8 rounded-none',
      'bg-white text-black',
      'border-2 border-black',
      'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      'hover:bg-gray-200',
      'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'transition-all duration-75',
      'active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
));
RetroModalClose.displayName = DialogPrimitive.Close.displayName;

const RetroModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%]',
        'max-h-[90vh] overflow-y-auto',
        // Retro styling
        'bg-white',
        'border-4 border-black',
        'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
        'p-6',
        // Animation
        'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      <RetroModalClose />
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
RetroModalContent.displayName = DialogPrimitive.Content.displayName;

const RetroModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mb-6 pb-4 border-b-2 border-black',
      'space-y-2',
      className
    )}
    {...props}
  />
);
RetroModalHeader.displayName = 'RetroModalHeader';

const RetroModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'mt-6 flex flex-wrap items-center justify-end gap-3',
      'border-t-2 border-black pt-4',
      className
    )}
    {...props}
  />
);
RetroModalFooter.displayName = 'RetroModalFooter';

const RetroModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-mono text-2xl font-bold text-black',
      className
    )}
    {...props}
  />
));
RetroModalTitle.displayName = DialogPrimitive.Title.displayName;

const RetroModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      'font-mono text-sm text-gray-700',
      className
    )}
    {...props}
  />
));
RetroModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  RetroModal,
  RetroModalTrigger,
  RetroModalClose,
  RetroModalContent,
  RetroModalHeader,
  RetroModalFooter,
  RetroModalTitle,
  RetroModalDescription,
};
