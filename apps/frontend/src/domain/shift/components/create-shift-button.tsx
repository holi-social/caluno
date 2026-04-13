'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useSheet } from '@/hooks/use-sheet';

export function CreateShiftButton() {
  const { open } = useSheet('shift', 'id');
  return (
    <Button size="lg" onClick={() => open()}>
      <PlusIcon /> Create Shift
    </Button>
  );
}
