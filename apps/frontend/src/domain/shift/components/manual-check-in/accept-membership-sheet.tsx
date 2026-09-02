'use client';

import {
  useCheckInApproveMembershipRequest,
  useCheckInVolunteerRequiredForms,
} from '@repo/data/react';
import { Button } from '@repo/ui';
import { Check, Circle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckInSheet } from './check-in-sheet';

type AcceptMembershipSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationUnitId: string;
  volunteerId: string;
  membershipRequestId: string | null;
  onAccepted: () => void;
};

export function AcceptMembershipSheet({
  open,
  onOpenChange,
  organizationUnitId,
  volunteerId,
  membershipRequestId,
  onAccepted,
}: AcceptMembershipSheetProps) {
  const t = useTranslations('CheckIn');
  const { data: requiredForms } = useCheckInVolunteerRequiredForms(
    organizationUnitId,
    volunteerId,
    open,
  );
  const approveMutation =
    useCheckInApproveMembershipRequest(organizationUnitId);

  const hasMissingForm = (requiredForms ?? []).some((f) => !f.submitted);

  const handleAccept = async () => {
    if (!membershipRequestId) return;

    try {
      await approveMutation.mutateAsync(membershipRequestId);
      onAccepted();
      onOpenChange(false);
    } catch {
      toast.error(t('acceptMembershipError'));
    }
  };

  return (
    <CheckInSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('acceptMembershipSheetTitle')}
      footer={
        <Button
          type="button"
          className="w-full"
          disabled={
            !membershipRequestId || hasMissingForm || approveMutation.isPending
          }
          onClick={handleAccept}
        >
          {t('acceptMembershipButton')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {(requiredForms ?? []).map((f) => (
          <div
            key={f.form.id}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-sm">{f.form.name}</span>
            <span
              className={
                f.submitted
                  ? 'flex items-center gap-1 text-sm text-green-600'
                  : 'flex items-center gap-1 text-sm text-orange-600'
              }
            >
              {f.submitted ? (
                <Check className="size-4" />
              ) : (
                <Circle className="size-4" />
              )}
              {f.submitted
                ? t('requiredFormSubmitted')
                : t('requiredFormMissing')}
            </span>
          </div>
        ))}
      </div>
    </CheckInSheet>
  );
}
