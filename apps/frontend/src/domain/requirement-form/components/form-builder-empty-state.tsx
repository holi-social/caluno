'use client';

import { Button } from '@repo/ui';
import { LayoutGrid, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FormBuilderEmptyStateProps {
  onAddBlock: () => void;
}

export function FormBuilderEmptyState({
  onAddBlock,
}: FormBuilderEmptyStateProps) {
  const t = useTranslations('RequirementForm.builder');

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center lg:h-full">
      <LayoutGrid className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">{t('emptyTitle')}</h3>
      <p className="text-sm text-muted-foreground">{t('emptyDescription')}</p>
      <Button size="lg" className="mt-2" onClick={onAddBlock}>
        <Plus className="mr-2 h-4 w-4" />
        {t('addBlock')}
      </Button>
    </div>
  );
}
