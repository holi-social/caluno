'use client';

import type { FormBlockField } from '@repo/data';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { FieldRenderer, type RenderableField } from './field-renderer';

export type FormBlockLike = {
  id: string;
  title: string;
  description?: string | null;
  fields?: Array<FormBlockField | RenderableField> | null;
};

interface FormBlockSectionProps {
  block: FormBlockLike;
  readOnly?: boolean;
  control?: Control<Record<string, string>>;
  errors?: FieldErrors<Record<string, string>>;
}

export function FormBlockSection({
  block,
  readOnly = false,
  control,
  errors,
}: FormBlockSectionProps) {
  const tForm = useTranslations('RequirementForm.volunteerForm');

  const fields = useMemo(() => {
    const sorted = [...(block.fields ?? [])] as FormBlockField[];
    sorted.sort((a, b) => a.fieldOrder - b.fieldOrder);
    return sorted;
  }, [block.fields]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{block.title}</h3>
        {block.description?.trim() && (
          <p className="mt-1 text-sm text-muted-foreground">
            {block.description.trim()}
          </p>
        )}
      </div>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm">{tForm('noFields')}</p>
      )}

      <div className="space-y-4">
        {fields.map((field) => {
          const renderable = field as RenderableField;

          if (readOnly || !control) {
            return (
              <FieldRenderer
                key={field.id}
                field={renderable}
                value=""
                onChange={() => {}}
                readOnly
              />
            );
          }

          return (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              defaultValue=""
              render={({ field: ctrlField }) => (
                <FieldRenderer
                  field={renderable}
                  value={ctrlField.value ?? ''}
                  onChange={ctrlField.onChange}
                  error={errors?.[field.id]?.message}
                />
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
