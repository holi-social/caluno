'use client';

import { useQueryClient } from '@repo/data/react';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { InviteShiftForm } from '@/domain/shift/components/invite-form';
import { useSheet } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';

const FORM_ID = 'invite-shift-form';

export function InviteShiftSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(
    'invite-shift',
    'id',
    'instanceId',
  );
  const shiftId = getParam('id');
  const instanceId = getParam('instanceId');
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success('Volunteers invitations changed');

    queryClient.invalidateQueries({
      queryKey: ['shiftVolunteers', instanceId],
    });
    queryClient.invalidateQueries({ queryKey: ['shift', shiftId] });
  };

  return (
    <ClippySheet
      title="Invite volunteers"
      description="Invited volunteers will receive an invitation email with shift details and a link to the system."
      formId={FORM_ID}
      {...sheetProps}
    >
      {shiftId && instanceId && (
        <InviteShiftForm
          formId={FORM_ID}
          shiftId={shiftId}
          instanceId={instanceId}
          onSuccess={handleSuccess}
          onPendingChange={setIsPending}
        />
      )}
    </ClippySheet>
  );
}
