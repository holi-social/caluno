'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FieldDescription,
  FieldLabel,
  Separator,
} from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';
import { copyToClipboard } from '@/lib/clipboard';
import type { RecurrenceDayValue } from '../constants';
import { shiftCreatedSuccessPath } from '../routes';
import { type InviteShiftFormValues, inviteShiftFormSchema } from '../schemas';
import { shiftShareUrl } from '../share';
import { TransferList } from './transfer-list';

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  inviteStatus?: import('@repo/data').ShiftInviteStatus | null;
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
}: InviteShiftFormProps) {
  const router = useRouter();
  const session = useSession();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');
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

  const currentUserId = session.data?.user?.id;
  const allMembers = availableMembers.filter((m) => m.id !== currentUserId);
  const statusById = new Map(
    invitedMembers.map((m) => [m.id, m.inviteStatus] as const),
  );

  const watchedIds = form.watch('invitedMemberIds');
  const invitedForList: Member[] = watchedIds.map((id) => {
    const fromAll = allMembers.find((m) => m.id === id);
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
        await setOpen(false, () => null);
        router.replace(shiftCreatedSuccessPath(orgUId, shiftId));
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
              {shift.isRecurring && (
                <>
                  <Separator />
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={inviteAllCheckboxId}
                        checked={form.watch('inviteAllInstances')}
                        onCheckedChange={(checked) =>
                          form.setValue(
                            'inviteAllInstances',
                            checked === true,
                            {
                              shouldValidate: true,
                            },
                          )
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
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          <Separator />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <p className="shrink-0 text-xl font-bold">{t('inviteForm.title')}</p>
          <TransferList
            available={allMembers}
            invited={invitedForList}
            onInvitedChange={(ids) => form.setValue('invitedMemberIds', ids)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0"
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
      </div>
    </FormSheet>
  );
}
