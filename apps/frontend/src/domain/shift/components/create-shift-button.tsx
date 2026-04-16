'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { FORM_ID } from '@/components/sheets/shift-sheet';
import { useSheetTrigger } from '@/hooks/use-sheet';

export function CreateShiftButton() {
  const { open } = useSheetTrigger(FORM_ID);
  return (
    <Button size="lg" onClick={() => open()}>
      <PlusIcon /> Create Shift
    </Button>
  );
}
