'use client';

import type { FormSection, FieldError as FieldErrorType } from '@/lib/types';
import { FieldRenderer } from './field-renderer';

export function FormStep({
  section,
  data,
  errors,
  onChange,
  showDocumentPreview,
}: {
  section: FormSection;
  data: Record<string, string | boolean | string[]>;
  errors: FieldErrorType[];
  onChange: (fieldId: string, value: string | boolean | string[]) => void;
  showDocumentPreview?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{section.title}</h2>
        {section.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {section.description}
          </p>
        )}
      </div>
      <div className="space-y-5">
        {section.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={data[field.id] ?? (field.type === 'checkbox' || field.type === 'document-acknowledgement' ? false : field.type === 'multichoice' ? [] : '')}
            onChange={(value) => onChange(field.id, value)}
            error={errors.find((e) => e.fieldId === field.id)}
            showDocumentPreview={showDocumentPreview}
          />
        ))}
      </div>
    </div>
  );
}
