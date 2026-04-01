'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useApproveMembershipRequest } from '@repo/data/react';
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
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { rejectMembershipRequest } from '../actions';

const rejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

interface MembershipRequestActionsProps {
  id: string;
  organizationUnitId: string;
}

export function MembershipRequestActions({
  id,
  organizationUnitId,
}: MembershipRequestActionsProps) {
  const router = useRouter();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id, organizationUnitId });
      toast.success('Membership request approved');
      router.refresh();
    } catch {
      toast.error('Failed to approve membership request');
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
        toast.success('Membership request rejected');
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
        <CheckIcon className="mr-1" />
        Approve
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsRejectDialogOpen(true)}
      >
        <XIcon className="mr-1" />
        Reject
      </Button>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject membership request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this membership request? Please
              provide a reason so the volunteer understands why their request
              was declined.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="rejectionReason">
                Rejection reason <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="rejectionReason"
                placeholder="Explain why the request is being rejected..."
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
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
