'use client';

import { Button, cn, Input } from '@repo/ui';
import { CheckIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';

interface ProfileFieldCardProps {
  label: string;
  value: string | null;
  missingValueLabel: string;
  subline: string;
  editingSubline: string;
  editButtonLabel: string;
  saveButtonLabel: string;
  isEmptyValue?: boolean;
  onSave: (value: string) => void;
  className?: string;
}

/**
 * A field card for data sourced from elsewhere (a profile, a prior step) that
 * can be overridden locally. Copy is fully caller-supplied so it stays
 * reusable across domains — see `AccountingProfileFieldCard` for the
 * accounting/contract-specific wrapper.
 */
export function ProfileFieldCard({
  label,
  value,
  missingValueLabel,
  subline,
  editingSubline,
  editButtonLabel,
  saveButtonLabel,
  isEmptyValue,
  onSave,
  className,
}: ProfileFieldCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const handleEdit = () => {
    setDraft(value ?? '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(draft);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'rounded-xl bg-muted p-4',
        isEmptyValue && 'border border-alert bg-alert/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        {!isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
          >
            <PencilIcon />
            <span className="sr-only">{editButtonLabel}</span>
          </Button>
        )}
      </div>

      <div className="mt-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              aria-label={label}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              size="icon-md"
              onClick={handleSave}
            >
              <CheckIcon />
              <span className="sr-only">{saveButtonLabel}</span>
            </Button>
          </div>
        ) : (
          <p
            className={cn(
              'text-base',
              isEmptyValue && 'text-muted-foreground italic',
            )}
          >
            {value || missingValueLabel}
          </p>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {isEditing ? editingSubline : subline}
      </p>
    </div>
  );
}
