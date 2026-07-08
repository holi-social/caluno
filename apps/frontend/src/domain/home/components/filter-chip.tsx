'use client';

import { Badge, cn } from '@repo/ui';
import type { LucideIcon } from 'lucide-react';

export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export function FilterChip({
  label,
  active,
  onClick,
  icon: Icon,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
      )}
    >
      <Badge variant={active ? 'default' : 'outline'} className="gap-1.5">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </Badge>
    </button>
  );
}
