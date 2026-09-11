'use client';

import type { FormBlock } from '@repo/data';
import { useTranslations } from 'next-intl';
import { FormBlockSection } from './form-block-section';
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
      <h3 className="mb-4 font-semibold">{t('previewTitle')}</h3>
      <div className="space-y-4">
        {blockRefs.map((ref) => {
          const block = availableBlocks.find((b) => b.id === ref.blockId);
          if (!block) return null;
          return (
            <div key={ref.id} className="rounded-lg border bg-card p-4">
              <FormBlockSection block={block} readOnly />
            </div>
          );
        })}
        {blockRefs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noPreview')}
          </p>
        )}
      </div>
    </div>
  );
}
