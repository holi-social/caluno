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
import { CreateProjectForm } from '@/domain/project/forms/create-form';

interface CreateProjectSheetProps {
  trigger?: React.ReactNode;
}

export function CreateProjectSheet({ trigger }: CreateProjectSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Create Project</SheetTitle>
          <SheetDescription>
            Create a new volunteer project for your organization.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            <CreateProjectForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
