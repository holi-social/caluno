'use client';

import { useOrgUId } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { EditShiftInstanceForm } from '@/domain/shift/components/edit-shift-instance-form';
import { useSheet } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';

export const FORM_ID = 'edit-shift-instance';

export function ShiftInstanceSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(
    FORM_ID,
    'id',
    'instanceId',
  );
  const shiftId = getParam('id');
  const instanceId = getParam('instanceId');
  const orgUId = useOrgUId();
  const router = useRouter();
  const t = useTranslations('ShiftInstanceDetail');

  const handleSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(t('toast.updated'));
  };

  return (
    <ClippySheet
      {...sheetProps}
      title={t('sheet.editTitle')}
      description={t('sheet.editDescription')}
      formId={`${FORM_ID}-form`}
    >
      {sheetProps.isOpen && shiftId && instanceId ? (
        <EditShiftInstanceForm
          orgUId={orgUId}
          shiftId={shiftId}
          instanceId={instanceId}
          onSuccess={handleSuccess}
          onPendingChange={setIsPending}
          formId={`${FORM_ID}-form`}
        />
      ) : null}
    </ClippySheet>
  );
}
