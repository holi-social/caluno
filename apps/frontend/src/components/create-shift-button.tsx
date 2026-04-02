'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useSheet } from '@/hooks/use-sheet';

export function CreateShiftButton() {
  const { open } = useSheet('shift', 'id');
  return (
    <Button size="lg" onClick={() => open()}>
      <PlusIcon className="mr-2 h-4 w-4" /> Create Shift
    </Button>
  );
}
