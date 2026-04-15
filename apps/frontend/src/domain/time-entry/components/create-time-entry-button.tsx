'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { FORM_ID } from '@/components/sheets/create-time-entry-sheet';
import { useSheetTrigger } from '@/hooks/use-sheet';

export function CreateTimeEntryButton() {
  const { open: openCreateTimeEntrySheet } = useSheetTrigger(FORM_ID);

  return (
    <Button onClick={() => openCreateTimeEntrySheet()}>
      <PlusIcon /> Add Time Entry
    </Button>
  );
}
