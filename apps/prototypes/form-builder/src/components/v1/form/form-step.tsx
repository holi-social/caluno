'use client';

import type { ResolvedBlock, FieldError as FieldErrorType } from '@/lib/types';
import { FieldRenderer } from './field-renderer';

export function FormStep({
  block,
  data,
  errors,
  onChange,
  showDocumentPreview,
}: {
  block: ResolvedBlock;
  data: Record<string, string | boolean | string[]>;
  errors: FieldErrorType[];
  onChange: (fieldId: string, value: string | boolean | string[]) => void;
  showDocumentPreview?: boolean;
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
        {block.fields.map((field) => (
          <FieldRenderer
            key={field.id}
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
        ))}
      </div>
    </div>
  );
}
