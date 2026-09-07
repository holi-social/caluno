'use client';

import { cn } from '@repo/ui';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type StepperRowProps = {
  label: string;
  sublabel?: string | undefined;
  /** Renders the orange "still to be chosen" state from the design. */
  isEmpty?: boolean | undefined;
  icon?: ReactNode | undefined;
  onClick: () => void;
};

export function StepperRow({
  label,
  sublabel,
  isEmpty,
  icon,
  onClick,
}: StepperRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 py-2 text-left"
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'flex items-center gap-2 truncate',
            isEmpty ? 'font-semibold text-orange-600' : 'font-semibold',
          )}
        >
          {icon}
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-muted-foreground">{sublabel}</p>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
