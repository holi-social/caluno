'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShiftVisibility } from '@repo/data';
import { useInviteAllowanceEligibility } from '@repo/data/react';
import {
  Button,
  Checkbox,
  FieldDescription,
  FieldLabel,
  Separator,
} from '@repo/ui';
import { Megaphone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { useRouter } from '@/i18n/navigation';
import type { RecurrenceDayValue } from '../constants';
import type { InviteAllowanceState } from '../invite-allowance-display';
import { type InviteShiftFormValues, inviteShiftFormSchema } from '../schemas';
import { setSuccessDialogCreatedShift } from '../success-dialog';
import { SendCallOutDialog } from './send-call-out-dialog';
import ShareLinkButton from './share-link-button';
import { ShiftInstanceSummaryCard } from './shift-instance-summary-card';
import { TransferList } from './transfer-list';

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  inviteStatus?: import('@repo/data').ShiftInviteStatus | null;
  /** Only set for a paid shift (VOLI-1248) — omitted, the list is unchanged. */
  allowanceState?: InviteAllowanceState | null;
};

interface InviteShiftFormProps {
  title: string;
  description: string;
  orgUId: string;
  shiftId: string;
  instanceId: string;
  isCreationFlow?: boolean;
  shift: {
    title: string;
    isRecurring: boolean;
    recurrenceDays: RecurrenceDayValue[];
    visibility: ShiftVisibility;
  };
  selectedInstance: {
    actualStartsAt: string | Date;
    actualEndsAt: string | Date;
  };
  availableMembers: Member[];
  invitedMembers: Member[];
  mutateVolunteers: (data: {
    memberIds: string[];
    inviteToAllInstances?: boolean;
  }) => Promise<{ serverError?: string }>;
  /**
   * Only set when this shift is paid — see `InviteShiftPageContent`. When
   * absent, no allowance query runs and the list renders exactly as it does
   * today (acceptance criterion 6).
   */
  paidAllowance?: {
    organizationUnitId: string;
    reimbursementTypeId: string;
    shiftDurationMinutes: number;
  };
}

export function InviteShiftForm({
  title,
  description,
  orgUId,
  shiftId,
  instanceId,
  isCreationFlow = false,
  shift,
  selectedInstance,
  availableMembers,
  invitedMembers,
  mutateVolunteers,
  paidAllowance,
}: InviteShiftFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const t = useTranslations('Shift');

  const { data: allowanceEligibility } = useInviteAllowanceEligibility({
    organizationUnitId: paidAllowance?.organizationUnitId,
    reimbursementTypeId: paidAllowance?.reimbursementTypeId,
    shiftDurationMinutes: paidAllowance?.shiftDurationMinutes,
  });

  const allowanceStateByVolunteerId = new Map(
    (allowanceEligibility ?? []).map((entry) => [
      entry.volunteerId,
      entry.state,
    ]),
  );

  const availableMembersWithAllowance: Member[] = paidAllowance
    ? availableMembers.map((member) => ({
        ...member,
        allowanceState:
          allowanceStateByVolunteerId.get(member.id) ??
          member.allowanceState ??
          null,
      }))
    : availableMembers;
  const locale = useLocale();
  const formatWithOptions = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date);

  const { open, setOpen } = useFormSheet();

  const schema = inviteShiftFormSchema();

  const form = useForm<InviteShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invitedMemberIds: invitedMembers.map((m) => m.id),
      inviteAllInstances: false,
    },
  });

  const isOpenShift = shift.visibility === ShiftVisibility.AllMembers;
  const statusById = new Map(
    invitedMembers.map((m) => [m.id, m.inviteStatus] as const),
  );

  const watchedIds = form.watch('invitedMemberIds');
  const invitedForList: Member[] = watchedIds.map((id) => {
    const fromAll = availableMembersWithAllowance.find((m) => m.id === id);
    if (fromAll) {
      return { ...fromAll, inviteStatus: statusById.get(id) ?? null };
    }
    const fromInvited = invitedMembers.find((m) => m.id === id);
    return (
      fromInvited ?? {
        id,
        name: id,
        email: '',
        inviteStatus: statusById.get(id) ?? null,
      }
    );
  });

  const inviteAllCheckboxId = useId();

  const instanceStartDate = new Date(selectedInstance.actualStartsAt);
  const instanceEndDate = new Date(selectedInstance.actualEndsAt);
  const isInstanceInThePast = instanceEndDate.getTime() < Date.now();

  const formattedDays = shift.isRecurring
    ? new Intl.ListFormat(locale, { type: 'conjunction' }).format(
        shift.recurrenceDays.map((day) => t(`recurrence.weekDay.${day}`)),
      )
    : '';

  const onSubmit = (data: InviteShiftFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const volunteersResult = await mutateVolunteers({
        memberIds: data.invitedMemberIds,
        inviteToAllInstances: data.inviteAllInstances,
      });
      if (volunteersResult?.serverError) {
        setServerError(volunteersResult.serverError);
        return;
      }

      if (isCreationFlow) {
        setSuccessDialogCreatedShift({ shiftId, instanceId });
        await setOpen(false);
        router.refresh();
        return;
      }

      await setOpen(false);
      router.refresh();
      toast.success(t('toast.inviteChanged'));
    });
  };

  return (
    <FormSheet
      onSubmit={form.handleSubmit(onSubmit)}
      title={title}
      description={description}
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
      fillContent
    >
      <div className="flex min-h-full flex-col gap-6">
        <div className="flex shrink-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {t('inviteForm.managingLabel')}
              </p>
              {!isInstanceInThePast ? (
                <SendCallOutDialog
                  orgUId={orgUId}
                  instanceId={instanceId}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Megaphone />
                      {t('instanceDetail.callOutCta')}
                    </Button>
                  }
                />
              ) : null}
            </div>
            <ShiftInstanceSummaryCard
              title={shift.title}
              startsAt={instanceStartDate}
              endsAt={instanceEndDate}
            >
              {shift.isRecurring && (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={inviteAllCheckboxId}
                    checked={form.watch('inviteAllInstances')}
                    onCheckedChange={(checked) =>
                      form.setValue('inviteAllInstances', checked === true, {
                        shouldValidate: true,
                      })
                    }
                    disabled={pending}
                  />
                  <div className="grid gap-1">
                    <FieldLabel
                      htmlFor={inviteAllCheckboxId}
                      className="font-normal"
                    >
                      {t('inviteForm.inviteAllLabel')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('inviteForm.inviteAllDescription', {
                        startDate: formatWithOptions(instanceStartDate, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        }),
                        days: formattedDays,
                      })}
                    </FieldDescription>
                  </div>
                </div>
              )}
            </ShiftInstanceSummaryCard>
          </div>

          <Separator />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <p className="shrink-0 text-xl font-bold">{t('inviteForm.title')}</p>
          <TransferList
            available={availableMembersWithAllowance}
            invited={invitedForList}
            onInvitedChange={(ids) => form.setValue('invitedMemberIds', ids)}
          />
          {isOpenShift && (
            <ShareLinkButton
              shiftId={shiftId}
              instanceId={instanceId}
              className="w-full shrink-0"
            />
          )}
        </div>
      </div>
    </FormSheet>
  );
}
