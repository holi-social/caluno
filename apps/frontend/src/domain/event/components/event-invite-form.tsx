'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { GetEventAttendeesQuery } from '@repo/data';
import { Button } from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import { TransferList } from '@/domain/shift/components/transfer-list';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';
import { copyToClipboard } from '@/lib/clipboard';
import { serverEventInviteFormSchema } from '../schemas';
import { eventShareUrl } from '../share';

type Member = GetEventAttendeesQuery['eventAttendees'][number];

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
  const session = useSession();
  const t = useTranslations('Event.invite');
  const tToast = useTranslations('Event.toast');
  const tCommon = useTranslations('Common');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();

  const { open, setOpen } = useFormSheet();

  const currentUserId = session.data?.user?.id;
  const allMembers = availableMembers.filter((m) => m.id !== currentUserId);

  const { handleSubmit, watch, setValue } = useForm<{ memberIds: string[] }>({
    resolver: zodResolver(serverEventInviteFormSchema),
    defaultValues: {
      memberIds: invitedMembers.map((m) => m.id),
    },
  });

  const watchedIds = watch('memberIds');
  const invited = allMembers.filter((m) => watchedIds.includes(m.id));

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
    >
      <div className="flex flex-col gap-4">
        <TransferList
          available={allMembers}
          invited={invited}
          onInvitedChange={(ids) => setValue('memberIds', ids)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            copyToClipboard(eventShareUrl(slug), tCommon('linkCopied'))
          }
        >
          <Share2 className="size-4 mr-2" />
          {t('copyInviteLink')}
        </Button>
        <p className="text-sm text-muted-foreground">{t('helperText')}</p>
      </div>
    </FormSheet>
  );
};
