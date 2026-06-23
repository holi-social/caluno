'use client';

import { useOrgUId } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { ClippySheet } from '@/components/sheets/clippy-sheet';
import { CreateShiftForm } from '@/domain/shift/components/create-form';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { resolveCreateShiftSuccessNavigation } from '@/domain/shift/create-shift-flow';
import { useSheet, useSheetTrigger } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';

export const FORM_ID = 'shift-form';

export function ShiftSheet() {
  const { setIsPending, getParam, ...sheetProps } = useSheet(FORM_ID, 'id');
  const inviteSheet = useSheetTrigger('invite-shift');
  const shiftId = getParam('id');
  const isEdit = !!shiftId;
  const orgUId = useOrgUId();
  const router = useRouter();
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');

  const handleEditSuccess = () => {
    router.refresh();
    sheetProps.close();
    toast.success(t('toast.updated'));
  };

  const handleCreateSuccess = (result: {
    shiftId: string;
    instanceId?: string;
  }) => {
    router.refresh();
    toast.success(t('toast.created'));

    const navigation = resolveCreateShiftSuccessNavigation(result);
    if (navigation.action === 'open-invite') {
      inviteSheet.open({
        id: navigation.shiftId,
        instanceId: navigation.instanceId,
      });
    } else {
      sheetProps.close();
    }
  };

  return (
    <ClippySheet
      {...sheetProps}
      title={isEdit ? t('sheet.editTitle') : t('sheet.createTitle')}
      description={
        isEdit ? t('sheet.editDescription') : t('sheet.createDescription')
      }
      formId={FORM_ID}
    >
      {shiftId ? (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              {tCommon('loading')}
            </p>
          }
        >
          <EditShiftForm
            orgUId={orgUId}
            shiftId={shiftId}
            onSuccess={handleEditSuccess}
            onPendingChange={setIsPending}
            formId={FORM_ID}
          />
        </Suspense>
      ) : (
        <CreateShiftForm
          formId={FORM_ID}
          onPendingChange={setIsPending}
          onSuccess={handleCreateSuccess}
        />
      )}
    </ClippySheet>
  );
}
