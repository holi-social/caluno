'use client';

import type { ResolvedBlock, FieldError as FieldErrorType } from '@/lib/types';
import { FieldRenderer } from './field-renderer';
import { SystemFieldBanner } from './system-field-banner';

export function FormStep({
  block,
  data,
  errors,
  onChange,
  showDocumentPreview,
  profilePrefilledFieldIds,
}: {
  block: ResolvedBlock;
  data: Record<string, string | boolean | string[]>;
  errors: FieldErrorType[];
  onChange: (fieldId: string, value: string | boolean | string[]) => void;
  showDocumentPreview?: boolean;
  profilePrefilledFieldIds?: Set<string>;
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
      <div className="space-y-5">
        {block.fields.map((field) => {
          const fromProfile =
            profilePrefilledFieldIds?.has(field.id) ?? false;
          return (
            <div
              key={field.id}
              className={fromProfile ? 'space-y-2' : undefined}
            >
              {fromProfile && <SystemFieldBanner />}
              <FieldRenderer
                field={{ ...field, required: block.effectiveRequired }}
                value={
                  data[field.id] ??
                  (field.type === 'checkbox' ||
                  field.type === 'document-acknowledgement'
                    ? false
                    : field.type === 'multichoice'
                      ? []
                      : '')
                }
                onChange={(value) => onChange(field.id, value)}
                error={errors.find((e) => e.fieldId === field.id)}
                showDocumentPreview={showDocumentPreview}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
