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
import { CreateTimeEntryForm } from '@/domain/time-entry/components/create-form';

interface Shift {
  id: string;
  title: string;
  volunteers?: Array<{ id: string; name: string; email: string }>;
}

interface CreateTimeEntrySheetProps {
  sessionId?: string;
  shifts?: Shift[];
  allVolunteers?: Array<{ id: string; name: string; email: string }>;
  trigger?: React.ReactNode;
}

export function CreateTimeEntrySheet({
  sessionId,
  shifts = [],
  allVolunteers = [],
  trigger,
}: CreateTimeEntrySheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="mr-2" />
            Add Time Entry
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Add Time Entry</SheetTitle>
          <SheetDescription>
            Record a new time entry for a volunteer shift session.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            <CreateTimeEntryForm
              sessionId={sessionId}
              shifts={shifts}
              allVolunteers={allVolunteers}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
