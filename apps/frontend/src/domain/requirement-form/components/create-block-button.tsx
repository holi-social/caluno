'use client';

import { Button } from '@repo/ui';
import { Plus } from 'lucide-react';
import { useSheetTrigger } from '@/hooks/use-sheet';

export function CreateBlockButton({
  size = 'lg',
  className,
}: {
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const { open } = useSheetTrigger('block-form');

  return (
    <Button size={size} className={className} onClick={() => open()}>
      <Plus className="mr-2 size-5" />
      Create Block
    </Button>
  );
}
