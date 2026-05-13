'use client';

import { Button, FieldDescription, FieldLabel } from '@repo/ui';
import { Check, Undo2 } from 'lucide-react';
import type { ResolvedBlock, FieldError as FieldErrorType } from '@/lib/types';
import { FieldRenderer } from './field-renderer';
import { ProfileFieldDisplay } from './profile-field-display';

export function FormStep({
  block,
  data,
  errors,
  onChange,
  showDocumentPreview,
  profilePrefilledFieldIds,
  editingFieldIds,
  formOrg,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
}: {
  block: ResolvedBlock;
  data: Record<string, string | boolean | string[]>;
  errors: FieldErrorType[];
  onChange: (fieldId: string, value: string | boolean | string[]) => void;
  showDocumentPreview?: boolean;
  profilePrefilledFieldIds?: Set<string>;
  editingFieldIds?: Set<string>;
  formOrg: string;
  onStartEdit?: (fieldId: string) => void;
  onCancelEdit?: (fieldId: string) => void;
  onConfirmEdit?: (fieldId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{block.title}</h2>
        {block.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {block.description}
          </p>
        )}
      </div>
      <div className="space-y-8">
        {block.fields.map((field) => {
          const fromProfile =
            profilePrefilledFieldIds?.has(field.id) ?? false;
          const editing = editingFieldIds?.has(field.id) ?? false;
          const fallback =
            field.type === 'checkbox' ||
            field.type === 'document-acknowledgement'
              ? false
              : field.type === 'multichoice'
                ? []
                : '';
          const value = data[field.id] ?? fallback;

          if (fromProfile && !editing) {
            return (
              <ProfileFieldDisplay
                key={field.id}
                field={field}
                value={value}
                formOrg={formOrg}
                onEdit={() => onStartEdit?.(field.id)}
              />
            );
          }

          if (fromProfile && editing) {
            return (
              <div key={field.id} className="space-y-2">
                <FieldLabel>
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </FieldLabel>
                {field.description && (
                  <FieldDescription>{field.description}</FieldDescription>
                )}
                <div className="border-primary bg-card relative space-y-3 rounded-lg border p-4">
                  <p className="text-destructive pr-10 text-sm">
                    Wenn Sie diese Information ändern, wird sie auch in Ihrem
                    Profil geändert.
                  </p>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <FieldRenderer
                        field={field}
                        value={value}
                        onChange={(v) => onChange(field.id, v)}
                        error={errors.find((e) => e.fieldId === field.id)}
                        hideLabel
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      className="size-9 shrink-0"
                      onClick={() => onConfirmEdit?.(field.id)}
                      aria-label="Änderung übernehmen"
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 size-8"
                    onClick={() => onCancelEdit?.(field.id)}
                    aria-label="Bearbeitung verwerfen"
                  >
                    <Undo2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <FieldRenderer
              key={field.id}
              field={field}
              value={value}
              onChange={(v) => onChange(field.id, v)}
              error={errors.find((e) => e.fieldId === field.id)}
              showDocumentPreview={showDocumentPreview}
            />
          );
        })}
      </div>
    </div>
  );
}
