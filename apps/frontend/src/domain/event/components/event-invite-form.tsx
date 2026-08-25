'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { EventInviteOrigin, EventInviteStatus } from '@repo/data';
import { Button } from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { TransferList } from '@/domain/shift/components/transfer-list';
import { preselectedInviteMemberIds } from '@/domain/shift/invite-status-display';
import { useRouter } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { toEventInviteDisplayState } from '../invite-status-display';
import { serverEventInviteFormSchema } from '../schemas';
import { eventShareUrl } from '../share';

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  inviteOrigin?: EventInviteOrigin | null;
  inviteStatus?: EventInviteStatus | null;
};

interface EventInviteFormProps {
  title: string;
  description: string;
  slug: string;
  availableMembers: Member[];
  invitedMembers: Member[];
  mutate: (data: { memberIds: string[] }) => Promise<{ serverError?: string }>;
}

export const EventInviteForm = ({
  title,
  description,
  slug,
  availableMembers,
  invitedMembers,
  mutate,
}: EventInviteFormProps) => {
  const router = useRouter();
  const t = useTranslations('Event.invite');
  const tToast = useTranslations('Event.toast');
  const tCommon = useTranslations('Common');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const { open, setOpen } = useFormSheet();

  const { handleSubmit, watch, setValue } = useForm<{ memberIds: string[] }>({
    resolver: zodResolver(serverEventInviteFormSchema),
    defaultValues: {
      memberIds: preselectedInviteMemberIds(invitedMembers),
    },
  });

  const statusById = new Map(invitedMembers.map((m) => [m.id, m] as const));

  const watchedIds = watch('memberIds');
  const invited: Member[] = watchedIds.map((id) => {
    const fromAvailable = availableMembers.find((m) => m.id === id);
    const saved = statusById.get(id);
    if (fromAvailable) {
      return {
        ...fromAvailable,
        inviteOrigin: saved?.inviteOrigin ?? null,
        inviteStatus: saved?.inviteStatus ?? null,
      };
    }
    const fromInvited = invitedMembers.find((m) => m.id === id);
    return (
      fromInvited ?? {
        id,
        name: id,
        email: '',
        inviteOrigin: saved?.inviteOrigin ?? null,
        inviteStatus: saved?.inviteStatus ?? null,
      }
    );
  });

  const invitedForList = invited.map((member) => ({
    ...member,
    displayState: toEventInviteDisplayState({
      origin: member.inviteOrigin,
      status: member.inviteStatus,
    }),
  }));

  const onSubmit = async (formData: { memberIds: string[] }) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate(formData);
      if (result.serverError) {
        setServerError(result.serverError);
      } else {
        await setOpen(false);
        router.refresh();
        toast.success(tToast('invited'));
      }
    });
  };

  return (
    <FormSheet
      onSubmit={handleSubmit(onSubmit)}
      title={title}
      description={description}
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
      fillContent
    >
      <div className="flex min-h-full flex-col gap-4">
        <TransferList
          available={availableMembers}
          invited={invitedForList}
          onInvitedChange={(ids) => setValue('memberIds', ids)}
        />
        <p className="shrink-0 text-sm text-muted-foreground">
          {t('helperText')}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full shrink-0"
          onClick={() =>
            copyToClipboard(eventShareUrl(slug), tCommon('linkCopied'))
          }
        >
          <Share2 className="size-4 mr-2" />
          {t('copyInviteLink')}
        </Button>
      </div>
    </FormSheet>
  );
};
