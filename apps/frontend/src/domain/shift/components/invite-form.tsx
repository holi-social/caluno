'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMemberships,
  useOrgUId,
  useShift,
  useShiftInstances,
  useShiftVolunteers,
} from '@repo/data/react';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Separator,
} from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { copyToClipboard } from '@/lib/clipboard';
import { updateShiftStaffing, updateShiftVolunteers } from '../actions';
import { type InviteShiftFormValues, inviteShiftFormSchema } from '../schemas';
import { shiftShareUrl } from '../share';
import { TransferList } from './transfer-list';

interface InviteShiftFormProps {
  formId?: string;
  shiftId: string;
  instanceId: string;
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
}

export function InviteShiftForm({
  formId,
  shiftId,
  instanceId,
  onSuccess,
  onPendingChange,
}: InviteShiftFormProps) {
  const orgUId = useOrgUId();
  const session = useSession();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const formatWithOptions = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date);

  const { data: shift } = useShift(shiftId);
  const { data: shiftVolunteers } = useShiftVolunteers(instanceId);
  const { data: memberships } = useMemberships(orgUId);
  const { data: shiftInstances } = useShiftInstances(shiftId);

  const schema = inviteShiftFormSchema({
    minMaxVolunteers: t('validation.minMaxVolunteers'),
  });

  const form = useForm<InviteShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minVolunteers: null,
      maxVolunteers: null,
      invitedMemberIds: [],
      inviteAllInstances: false,
    },
  });

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (shift?.id) {
      form.setValue('minVolunteers', shift.minVolunteers ?? null);
      form.setValue('maxVolunteers', shift.maxVolunteers ?? null);
    }
  }, [shift?.id, shift?.minVolunteers, shift?.maxVolunteers, form.setValue]);

  useEffect(() => {
    if (shiftVolunteers) {
      form.setValue(
        'invitedMemberIds',
        shiftVolunteers.map((v) => v.id),
      );
    }
  }, [shiftVolunteers, form.setValue]);

  const currentUserId = session.data?.user?.id;

  const allMembers = (memberships ?? [])
    .map((m) => m.user)
    .filter((u) => u.id !== currentUserId);

  const watchedIds = form.watch('invitedMemberIds');
  const invitedMembers = allMembers.filter((m) => watchedIds.includes(m.id));

  const selectedInstance = shiftInstances?.find((i) => i.id === instanceId);
  const isRecurring = !!shift?.rrule && (shift.recurrenceDays.length ?? 0) > 0;
  const inviteAllCheckboxId = useId();

  const instanceStartDate = selectedInstance
    ? new Date(selectedInstance.actualStartsAt)
    : null;
  const instanceEndDate = selectedInstance
    ? new Date(selectedInstance.actualEndsAt)
    : null;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  const formattedDays = isRecurring
    ? new Intl.ListFormat(locale, { type: 'conjunction' }).format(
        shift.recurrenceDays.map((day) => t(`recurrence.weekDay.${day}`)),
      )
    : '';

  const onSubmit = (data: InviteShiftFormValues) => {
    startTransition(async () => {
      const staffingResult = await updateShiftStaffing({
        shiftId,
        organizationUnitId: orgUId,
        minVolunteers: data.minVolunteers ?? null,
        maxVolunteers: data.maxVolunteers ?? null,
      });
      if (staffingResult?.serverError) {
        toast.error(staffingResult.serverError);
        return;
      }

      const updateResult = await updateShiftVolunteers({
        instanceId,
        organizationUnitId: orgUId,
        memberIds: data.invitedMemberIds,
        inviteToAllInstances: data.inviteAllInstances,
      });
      if (updateResult?.serverError) {
        toast.error(updateResult.serverError);
        return;
      }

      onSuccess?.();
    });
  };

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6 h-full"
    >
      {selectedInstance && instanceStartDate && instanceEndDate && shift && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t('inviteForm.managingLabel')}
          </p>
          <Card>
            <CardContent className="flex justify-between items-start gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {formatWithOptions(instanceStartDate, dateOptions)}
                </p>
                <p className="text-muted-foreground">{shift.title}</p>
              </div>
              <p className="text-lg font-semibold whitespace-nowrap">
                {formatWithOptions(instanceStartDate, timeOptions)} -{' '}
                {formatWithOptions(instanceEndDate, timeOptions)}
              </p>
            </CardContent>
            {isRecurring && (
              <>
                <Separator />
                <CardContent>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={inviteAllCheckboxId}
                      checked={form.watch('inviteAllInstances')}
                      onCheckedChange={(checked) =>
                        form.setValue('inviteAllInstances', checked === true, {
                          shouldValidate: true,
                        })
                      }
                      disabled={isPending}
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
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Min / Max row */}
      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel htmlFor="minVolunteers">
            {t('inviteForm.minVolunteersLabel')}
          </FieldLabel>
          <Input
            id="minVolunteers"
            type="number"
            min={1}
            placeholder={t('inviteForm.minVolunteersPlaceholder')}
            disabled={isPending}
            {...form.register('minVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('inviteForm.minVolunteersDescription')}
          </FieldDescription>
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="maxVolunteers">
            {t('inviteForm.maxVolunteersLabel')}
          </FieldLabel>
          <Input
            id="maxVolunteers"
            type="number"
            min={1}
            placeholder={t('inviteForm.maxVolunteersPlaceholder')}
            disabled={isPending}
            {...form.register('maxVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('inviteForm.maxVolunteersDescription')}
          </FieldDescription>
          <FieldError errors={[form.formState.errors.maxVolunteers]} />
        </Field>
      </div>

      <Separator />

      {/* Invite section */}
      <div className="flex flex-col gap-4 flex-1">
        <p className="text-xl font-bold">{t('inviteForm.title')}</p>
        <TransferList
          available={allMembers}
          invited={invitedMembers}
          onInvitedChange={(ids) => form.setValue('invitedMemberIds', ids)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            copyToClipboard(
              shiftShareUrl(shiftId, instanceId),
              tCommon('linkCopied'),
            )
          }
        >
          <Share2 className="size-4 mr-2" />
          {t('inviteForm.copyInviteLink')}
        </Button>
      </div>
    </form>
  );
}
