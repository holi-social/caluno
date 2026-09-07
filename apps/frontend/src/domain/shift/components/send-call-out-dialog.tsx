'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui';
import { Megaphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { sendShiftInstanceCallOut } from '../actions';

interface SendCallOutDialogProps {
  orgUId: string;
  instanceId: string;
  trigger: ReactNode;
}

export function SendCallOutDialog({
  orgUId,
  instanceId,
  trigger,
}: SendCallOutDialogProps) {
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [, startSendTransition] = useTransition();

  const runSend = () => {
    startSendTransition(async () => {
      const result = await sendShiftInstanceCallOut(orgUId, instanceId, {});
      if (result?.serverError) {
        toast.error(
          t('instanceDetail.callOutDialog.error', {
            error: result.serverError,
          }),
        );
        return;
      }

      if (result?.data?.sentToManagerFallback) {
        toast.success(t('instanceDetail.callOutDialog.noRecipients'));
      } else {
        toast.success(
          t('instanceDetail.callOutDialog.success', {
            count: result?.data?.recipientCount ?? 0,
          }),
        );
      }
      router.refresh();
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('instanceDetail.callOutDialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('instanceDetail.callOutDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={runSend}>
            <Megaphone />
            {t('instanceDetail.callOutDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
