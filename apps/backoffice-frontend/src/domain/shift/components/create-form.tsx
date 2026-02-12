'use client';

import { useOrgId } from '@repo/data/react';
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
} from '@repo/ui';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createShift } from '../actions';
import type { ShiftFormValues } from '../schemas';
import { copyToClipboard, shiftShareUrl } from '../share';
import { ShiftForm } from './shift-form';

export function CreateShiftForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [shiftId, setShiftId] = useState<string>();
  const orgId = useOrgId();

  const handleModalClose = (open: boolean) => {
    setSuccessModalOpen(open);
    if (!open) {
      router.push(`/${orgId}/shifts/${shiftId}`);
    }
  };

  const handleCopyToClipboard = () => {
    copyToClipboard(shiftId);
  };

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        router.push(`/${orgId}/shifts/${result.data?.id}`);
        setShiftId(result.data?.id);
        setSuccessModalOpen(true);
      }
    });
  };

  return (
    <>
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {serverError}
        </div>
      )}

      <ShiftForm
        organizationId={orgId}
        onSubmit={onSubmit}
        isPending={isPending}
      />
      <Dialog open={isSuccessModalOpen} onOpenChange={handleModalClose} modal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift created</DialogTitle>
            <DialogDescription>
              Your shift has been published. Share this link with volunteers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 my-4">
            <Input value={shiftShareUrl(shiftId)} autoFocus />
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
