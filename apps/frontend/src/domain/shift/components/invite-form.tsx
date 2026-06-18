'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useMemberships,
  useOrgUId,
  useShift,
  useShiftVolunteers,
} from '@repo/data/react';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Separator,
} from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';
import { copyToClipboard } from '@/lib/clipboard';
import { inviteShiftVolunteers, updateShiftStaffing } from '../actions';
import { type InviteShiftFormValues, inviteShiftFormSchema } from '../schemas';
import { shiftShareUrl } from '../share';
import { TransferList } from './transfer-list';

interface InviteShiftFormProps {
  formId?: string;
  shiftId: string;
  onSuccess?: () => void;
  onPendingChange?: (isPending: boolean) => void;
}

export function InviteShiftForm({
  formId,
  shiftId,
  onSuccess,
  onPendingChange,
}: InviteShiftFormProps) {
  const orgUId = useOrgUId();
  const session = useSession();
  const [isPending, startTransition] = useTransition();

  const { data: shift } = useShift(shiftId);
  const { data: shiftVolunteers } = useShiftVolunteers(shiftId);
  const { data: memberships } = useMemberships(orgUId);

  const form = useForm<InviteShiftFormValues>({
    resolver: zodResolver(inviteShiftFormSchema),
    defaultValues: {
      minVolunteers: null,
      maxVolunteers: null,
      invitedMemberIds: [],
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
  const existingVolunteers = shiftVolunteers ?? [];
  const existingIds = existingVolunteers.map((v) => v.id);

  const allMembers = (memberships ?? [])
    .map((m) => m.user)
    .filter((u) => u.id !== currentUserId);

  const watchedIds = form.watch('invitedMemberIds');
  const invitedMembers = allMembers.filter((m) => watchedIds.includes(m.id));

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

      const newIds = data.invitedMemberIds.filter(
        (id) => !existingIds.includes(id),
      );
      if (newIds.length > 0) {
        const inviteResult = await inviteShiftVolunteers({
          shiftId,
          organizationUnitId: orgUId,
          memberIds: newIds,
        });
        if (inviteResult?.serverError) {
          toast.error(inviteResult.serverError);
          return;
        }
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
      {/* Min / Max row */}
      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel htmlFor="minVolunteers">Min volunteers</FieldLabel>
          <Input
            id="minVolunteers"
            type="number"
            min={1}
            placeholder="e.g. 2"
            disabled={isPending}
            {...form.register('minVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            Minimum number of people required to open the shift
          </FieldDescription>
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="maxVolunteers">Max volunteers</FieldLabel>
          <Input
            id="maxVolunteers"
            type="number"
            min={1}
            placeholder="e.g. 50"
            disabled={isPending}
            {...form.register('maxVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            Maximum number of people allowed to sign up for the shift
          </FieldDescription>
          <FieldError errors={[form.formState.errors.maxVolunteers]} />
        </Field>
      </div>

      <Separator />

      {/* Invite section */}
      <div className="flex flex-col gap-4 flex-1">
        <p className="text-xl font-bold">Invite and manage participants</p>
        <TransferList
          available={allMembers}
          invited={invitedMembers}
          onInvitedChange={(ids) => form.setValue('invitedMemberIds', ids)}
          readonlyIds={existingIds}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            copyToClipboard(shiftShareUrl(shiftId), 'Invite link copied')
          }
        >
          <Share2 className="size-4 mr-2" />
          Copy invite link
        </Button>
      </div>
    </form>
  );
}
