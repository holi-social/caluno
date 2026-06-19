'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FORM_ID } from '@/components/sheets/shift-sheet';
import { useSheetTrigger } from '@/hooks/use-sheet';

export function CreateShiftButton() {
  const { open } = useSheetTrigger(FORM_ID);
  const t = useTranslations('Shift');

  return (
    <>
      <Button size="icon-sm" className="sm:hidden" onClick={() => open()}>
        <PlusIcon />
      </Button>

      <Button
        size="icon-sm"
        className="hidden inline-flex"
        onClick={() => open()}
      >
        <PlusIcon />
        {t('page.createButton')}
      </Button>
    </>
  );
}
