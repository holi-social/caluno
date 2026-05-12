'use client';

import { UserCircle2 } from 'lucide-react';
import type { SystemRequirementPreset } from '@/lib/system-requirements';

export function AvailableSystemFieldCard({
  preset,
  onAdd,
}: {
  preset: SystemRequirementPreset;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`${preset.defaultLabel} hinzufuegen`}
      className="bg-background hover:bg-accent/30 flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
    >
      <UserCircle2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{preset.defaultLabel}</p>
        {preset.defaultDescription && (
          <p className="text-muted-foreground mt-0.5 text-sm">
            {preset.defaultDescription}
          </p>
        )}
      </div>
    </button>
  );
}
