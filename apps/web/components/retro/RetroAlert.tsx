/**
 * RetroAlert Component
 *
 * Retro/Pixel design alert for:
 * - Error messages
 * - Success notifications
 * - Warning messages
 * - Info alerts
 */

import * as React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetroAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  description?: string;
}

const variantConfigs = {
  error: {
    bg: 'bg-red-100',
    border: 'border-red-600',
    text: 'text-red-800',
    shadow: 'shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]',
    icon: AlertCircle,
  },
  success: {
    bg: 'bg-green-100',
    border: 'border-green-600',
    text: 'text-green-800',
    shadow: 'shadow-[3px_3px_0px_0px_rgba(22,163,74,1)]',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-600',
    text: 'text-yellow-800',
    shadow: 'shadow-[3px_3px_0px_0px_rgba(202,138,4,1)]',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-100',
    border: 'border-blue-600',
    text: 'text-blue-800',
    shadow: 'shadow-[3px_3px_0px_0px_rgba(37,99,235,1)]',
    icon: Info,
  },
};

const RetroAlert = React.forwardRef<HTMLDivElement, RetroAlertProps>(
  ({
    variant = 'info',
    title,
    description,
    className,
    children,
    ...props
  }, ref) => {
    const config = variantConfigs[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'relative w-full rounded-none',
          'border-3',
          'p-4',
          'font-mono',
          'flex gap-4',
          // Variant
          config.bg,
          config.border,
          config.text,
          config.shadow,
          className
        )}
        role="alert"
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          {title && (
            <h4 className="font-bold text-sm">{title}</h4>
          )}
          {description && (
            <p className="text-xs opacity-90">{description}</p>
          )}
          {children && (
            <div className="text-xs">{children}</div>
          )}
        </div>
      </div>
    );
  }
);
RetroAlert.displayName = 'RetroAlert';

export { RetroAlert };
