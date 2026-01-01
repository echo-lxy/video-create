import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  const { onOpenChange } = React.useContext(DialogContext);

  return (
    <div
      className={cn(
        'relative z-50 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-auto',
        className
      )}
      {...props}
    >
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div className={cn('p-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-100', className)} {...props}>
      {children}
    </h2>
  );
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div className={cn('p-6 pt-4 flex justify-end gap-2', className)} {...props}>
      {children}
    </div>
  );
}

