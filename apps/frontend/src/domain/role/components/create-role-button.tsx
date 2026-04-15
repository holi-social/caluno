'use client';

import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { FORM_ID } from '@/components/sheets/create-role-sheet';
import { useSheetTrigger } from '@/hooks/use-sheet';

export function CreateRoleButton() {
  const { open: openCreateRoleSheet } = useSheetTrigger(FORM_ID);

  return (
    <Button onClick={() => openCreateRoleSheet()}>
      <PlusIcon />
      Create Role
    </Button>
  );
}
