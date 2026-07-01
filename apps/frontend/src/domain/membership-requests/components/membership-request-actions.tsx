'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  MembershipRequestStatus,
  useApproveMembershipRequest,
  useQueryClient,
} from '@repo/data/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Textarea,
} from '@repo/ui';
import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { useRouter } from '@/i18n/navigation';
import { rejectMembershipRequest } from '../actions';

interface MembershipRequestActionsProps {
  id: string;
  organizationUnitId: string;
}

export function MembershipRequestActions({
  id,
  organizationUnitId,
}: MembershipRequestActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('MembershipRequest');
  const tCommon = useTranslations('Common');

  const rejectSchema = z.object({
    rejectionReason: z.string().min(1, t('validation.rejectionReasonRequired')),
  });

  type RejectFormValues = z.infer<typeof rejectSchema>;

  const approveMutation = useApproveMembershipRequest();

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectionReason: '' },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const invalidateQuery = (status: MembershipRequestStatus) => {
    queryClient.invalidateQueries({
      queryKey: ['membershipRequests', organizationUnitId, status],
    });
    queryClient.invalidateQueries({
      queryKey: ['membershipRequestCount', organizationUnitId],
    });
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id, organizationUnitId });
      toast.success(t('toast.approved'));
      invalidateQuery(MembershipRequestStatus.Accepted);
      router.refresh();
    } catch {
      toast.error(t('toast.approveFailed'));
    }
  };

  const onSubmit = (formData: RejectFormValues) => {
    startTransition(async () => {
      const result = await rejectMembershipRequest({
        id,
        organizationUnitId,
        rejectionReason: formData.rejectionReason,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        invalidateQuery(MembershipRequestStatus.Pending);
        invalidateQuery(MembershipRequestStatus.Rejected);
        toast.success(t('toast.rejected'));
        setIsRejectDialogOpen(false);
        reset();
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    setIsRejectDialogOpen(false);
    reset();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleApprove}
        disabled={approveMutation.isPending}
      >
        <CheckIcon />
        {t('actions.approve')}
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsRejectDialogOpen(true)}
      >
        <XIcon />
        {t('actions.reject')}
      </Button>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.rejectDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('actions.rejectDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="rejectionReason">
                {t('actions.rejectionReasonLabel')}{' '}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="rejectionReason"
                placeholder={t('actions.rejectionReasonPlaceholder')}
                disabled={isPending}
                aria-invalid={!!errors.rejectionReason}
                {...register('rejectionReason')}
              />
              {errors.rejectionReason && (
                <FieldError>{errors.rejectionReason.message}</FieldError>
              )}
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? t('actions.rejecting') : t('actions.reject')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
