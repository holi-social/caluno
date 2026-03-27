'use client';

import type { RoleListItem } from '@repo/data';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { EditRoleForm } from '../forms/edit-form';

interface EditRoleSheetProps {
  role: RoleListItem;
  trigger?: React.ReactNode;
}

export function EditRoleSheet({ role, trigger }: EditRoleSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <PencilIcon className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Edit Role</SheetTitle>
          <SheetDescription>
            Update the permissions for {role.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            <EditRoleForm role={role} onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
