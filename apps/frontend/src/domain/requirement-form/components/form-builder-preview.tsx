'use client';

import type { FormBlock } from '@repo/data';
import { useTranslations } from 'next-intl';
import type { BuilderBlockRef } from './form-builder-state';

interface FormBuilderPreviewProps {
  blockRefs: BuilderBlockRef[];
  availableBlocks: FormBlock[];
}

export function FormBuilderPreview({
  blockRefs,
  availableBlocks,
}: FormBuilderPreviewProps) {
  const t = useTranslations('RequirementForm.builder');

  return (
    <div className="rounded-lg border bg-muted/30 p-4 lg:min-h-0 lg:overflow-y-auto">
      <h3 className="font-semibold mb-4">{t('previewTitle')}</h3>
      <div className="space-y-4">
        {blockRefs.map((ref) => {
          const block = availableBlocks.find((b) => b.id === ref.blockId);
          if (!block) return null;
          return (
            <div key={ref.id} className="rounded-lg border bg-card p-4">
              <h4 className="font-medium">{block.title}</h4>
              <div className="mt-2 space-y-2">
                {block.fields?.map((field) => (
                  <div key={field.id}>
                    <label htmlFor={`preview-${field.id}`} className="text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </label>
                    <div
                      id={`preview-${field.id}`}
                      className="mt-1 h-8 rounded border bg-background px-2 text-sm text-muted-foreground flex items-center"
                    >
                      {field.placeholder || field.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {blockRefs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('noPreview')}
          </p>
        )}
      </div>
    </div>
  );
}
