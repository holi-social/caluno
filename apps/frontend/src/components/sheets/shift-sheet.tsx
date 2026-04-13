'use client';

import { useOrgUId } from '@repo/data/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { CreateShiftForm } from '@/domain/shift/components/create-form';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { useSheet } from '@/hooks/use-sheet';

export function ShiftSheet() {
  const { isOpen, close, getParam } = useSheet('shift', 'id');
  const shiftId = getParam('id');
  const isEdit = !!shiftId;
  const orgUId = useOrgUId();
  const router = useRouter();

  const handleSuccess = () => {
    close();
    router.refresh();
    toast.success(isEdit ? 'Shift Updated' : 'Shift created');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isEdit ? 'Edit shift' : 'Create shift'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Edit shift.' : 'Create a new shift.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            {isEdit && shiftId ? (
              <Suspense
                fallback={
                  <p className="text-sm text-muted-foreground">Loading…</p>
                }
              >
                <EditShiftForm
                  orgUId={orgUId}
                  shiftId={shiftId}
                  onSuccess={handleSuccess}
                  onCancel={close}
                />
              </Suspense>
            ) : (
              <CreateShiftForm onCancel={close} />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
