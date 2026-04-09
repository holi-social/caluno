'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { InviteShiftForm } from '@/domain/shift/components/invite-form';
import { useSheet } from '@/hooks/use-sheet';

export function InviteShiftSheet() {
  const { isOpen, close, getParam } = useSheet('invite-shift', 'id');
  const shiftId = getParam('id');
  const router = useRouter();

  const handleSuccess = () => {
    close();
    router.refresh();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Invite volunteers</SheetTitle>
          <SheetDescription>
            Invited volunteers will receive an invitation email with shift
            details and a link to the system.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-6">
            {shiftId && (
              <InviteShiftForm
                shiftId={shiftId}
                onSuccess={handleSuccess}
                onCancel={close}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
