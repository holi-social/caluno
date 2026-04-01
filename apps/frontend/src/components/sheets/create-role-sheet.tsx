'use client';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { CreateRoleForm } from '@/domain/role/forms/create-form';

interface CreateRoleSheetProps {
  trigger?: React.ReactNode;
}

export function CreateRoleSheet({ trigger }: CreateRoleSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="mr-2" />
            Create Role
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Create Role</SheetTitle>
          <SheetDescription>
            Define a new role with specific permissions.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            <CreateRoleForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
