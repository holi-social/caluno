'use client';

import { Button, FieldDescription, FieldLabel } from '@repo/ui';
import { Pencil } from 'lucide-react';
import type { FormField } from '@/lib/types';

/**
 * Volunteer-facing renderer for a state-3 (profile-prefilled) field.
 * Shows the value as a static, secondary-tinted card with an edit button.
 * Clicking edit hands control back to the parent which swaps in the input.
 */
export function ProfileFieldDisplay({
  field,
  value,
  formOrg,
  onEdit,
}: {
  field: FormField;
  value: string | boolean | string[];
  formOrg: string;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <div className="bg-secondary relative rounded-lg px-4 py-3 pr-12">
        <p className="text-foreground mt-1 text-lg">{renderValue(value)}</p>
        <p className="text-muted-foreground text-xs">
          Wird mit {formOrg} geteilt.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={onEdit}
          aria-label="Bearbeiten"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function renderValue(value: string | boolean | string[]): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  return value || '—';
}
