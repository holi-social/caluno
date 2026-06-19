'use client';

import { useQueryClient } from '@repo/data/react';
import { useTranslations } from 'next-intl';
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
  );
  const shiftId = getParam('id');
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Shift');

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(t('toast.inviteChanged'));

    queryClient.invalidateQueries({ queryKey: ['shiftVolunteers', shiftId] });
    queryClient.invalidateQueries({ queryKey: ['shift', shiftId] });
  };

  return (
    <ClippySheet
      title={t('sheet.inviteTitle')}
      description={t('sheet.inviteDescription')}
      formId={FORM_ID}
      {...sheetProps}
    >
      {shiftId && (
        <InviteShiftForm
          formId={FORM_ID}
          shiftId={shiftId}
          onSuccess={handleSuccess}
          onPendingChange={setIsPending}
        />
      )}
    </ClippySheet>
  );
}
