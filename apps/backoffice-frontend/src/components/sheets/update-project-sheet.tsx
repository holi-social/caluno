'use client';

import type { Project } from '@repo/data';
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
import { UpdateProjectForm } from '../../domain/project/forms/update-form';

interface UpdateProjectSheetProps {
  project: Omit<Project, 'organization' | 'createdBy'>;
  trigger?: React.ReactNode;
}

export function UpdateProjectSheet({
  project,
  trigger,
}: UpdateProjectSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Update Project
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Update Project</SheetTitle>
          <SheetDescription>Update this volunteer project.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            <UpdateProjectForm
              project={project}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
