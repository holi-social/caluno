'use client';

import type { ProjectListItem } from '@repo/data';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui';
import { Copy, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateShiftForm } from '@/domain/shift/components/create-form';
import { shiftShareUrl } from '@/domain/shift/share';
import { copyToClipboard } from '@/lib/clipboard';

interface CreateShiftSheetProps {
  projects: ProjectListItem[];
  trigger?: React.ReactNode;
}

export function CreateShiftSheet({ trigger, projects }: CreateShiftSheetProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shiftId, setShiftId] = useState<string>();

  const handleSuccess = (id: string) => {
    setShiftId(id);
    setSheetOpen(false);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      router.refresh();
    }
  };

  const handleCopyToClipboard = () => {
    copyToClipboard(shiftShareUrl(shiftId), 'Shift link copied to clipboard');
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-2xl">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Create Shift</SheetTitle>
            <SheetDescription>
              Create a new volunteer shift for your organization.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="mt-6">
              <CreateShiftForm onSuccess={handleSuccess} projects={projects} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange} modal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift created</DialogTitle>
            <DialogDescription>
              Your shift has been published. Share this link with volunteers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 my-4">
            <Input value={shiftShareUrl(shiftId)} readOnly autoFocus />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopyToClipboard}
            >
              <Copy />
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
