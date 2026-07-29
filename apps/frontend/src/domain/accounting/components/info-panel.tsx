import { cn } from '@repo/ui';
import type { ReactNode } from 'react';

interface InfoPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/** Muted, titled box used for the small supporting-info cards in the creation modals. */
export function InfoPanel({ title, children, className }: InfoPanelProps) {
  return (
    <div className={cn('rounded-xl bg-muted p-4', className)}>
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
