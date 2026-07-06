'use client';

import { Badge, cn } from '@repo/ui';

export interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
      )}
    >
      <Badge variant={active ? 'default' : 'outline'}>{label}</Badge>
    </button>
  );
}
