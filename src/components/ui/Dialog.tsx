import { type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';

/**
 * Simple Dialog wrapper built on top of the existing Modal component.
 * It provides the three named exports expected by the project:
 *   - Dialog          – the root component controlling visibility.
 *   - DialogOverlay   – a backdrop element (styled via Tailwind utilities).
 *   - DialogContent   – the inner container for modal content.
 *
 * The implementation mirrors typical Radix UI Dialog API to keep existing usage
 * (open, onOpenChange) compatible while re‑using the fully‑featured Modal
 * component that already handles focus trapping and keyboard accessibility.
 */

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal open={open} onClose={() => onOpenChange(false)}>
      {children}
    </Modal>
  );
}

export function DialogOverlay({ className }: { className?: string }) {
  return <div className={cn('fixed inset-0 bg-black/30', className)} />;
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // The Modal component already provides the surrounding panel; this wrapper
  // simply applies additional styling to its inner content.
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-6', className)}>
      {children}
    </div>
  );
}
