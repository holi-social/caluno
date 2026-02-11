'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrgId } from '@repo/data/react';
import {
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@repo/ui';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createShift } from '../actions';
import { type CreateShiftFormValues, createShiftSchema } from '../schemas';
import { InviteList } from './invite-list';

const shiftShareUrl = (shiftId?: string) =>
  `${process.env.NEXT_PUBLIC_BACKOFFICE_URL}/shifts/${shiftId}`;

export function CreateShiftForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [shiftId, setShiftId] = useState<string>();

  const organizationId = useOrgId();
  const orgId = useOrgId();

  const handleModalClose = (open: boolean) => {
    setSuccessModalOpen(open);
    if (!open) {
      router.push(`/${orgId}/shifts/${shiftId}`);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shiftShareUrl(shiftId));
  };

  const form = useForm<CreateShiftFormValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      name: '',
      startsAt: '',
      endsAt: '',
      location: '',
      instructions: '',
      openShift: true,
      organizationId,
      invitedMemberIds: [],
    },
  });

  const onSubmit = async (formData: CreateShiftFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createShift(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        router.push(`/${orgId}/shifts/${result.data?.id}`);
        setShiftId(result.data?.id);
        setSuccessModalOpen(true);
      }
    });
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="name">
            Name <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="name"
            disabled={isPending}
            placeholder="Morning Shift"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field>
            <FieldLabel htmlFor="startsAt">
              Start Time <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="startsAt"
              type="datetime-local"
              disabled={isPending}
              aria-invalid={!!errors.startsAt}
              {...register('startsAt')}
            />
            {errors.startsAt && (
              <FieldError>{errors.startsAt.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="endsAt">
              End Time <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="endsAt"
              type="datetime-local"
              disabled={isPending}
              aria-invalid={!!errors.endsAt}
              {...register('endsAt')}
            />
            {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="location">Location</FieldLabel>
          <Input
            id="location"
            disabled={isPending}
            placeholder="Main Hall, 123 Main St"
            aria-invalid={!!errors.location}
            {...register('location')}
          />
          {errors.location && (
            <FieldError>{errors.location.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
          <Textarea
            id="instructions"
            rows={4}
            placeholder="Describe the shift responsibilities and requirements..."
            disabled={isPending}
            aria-invalid={!!errors.instructions}
            {...register('instructions')}
          />
          {errors.instructions && (
            <FieldError>{errors.instructions.message}</FieldError>
          )}
        </Field>

        <Card className="rounded-md p-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="openShift">Open shift</FieldLabel>
              <FieldDescription>
                Any volunteer can join the shift
              </FieldDescription>
            </FieldContent>
            <Switch
              id="openShift"
              checked={watch('openShift')}
              onCheckedChange={(checked) => setValue('openShift', checked)}
              disabled={isPending}
              aria-invalid={!!errors.openShift}
            />
            {errors.openShift && (
              <FieldError>{errors.openShift.message}</FieldError>
            )}
          </Field>
        </Card>

        <Field>
          <FieldLabel htmlFor="instructions">Invited volunteers</FieldLabel>

          <InviteList
            organizationId={organizationId}
            value={watch('invitedMemberIds')}
            onChange={(ids) => setValue('invitedMemberIds', ids)}
          />

          {errors.invitedMemberIds && (
            <FieldError>{errors.invitedMemberIds.message}</FieldError>
          )}
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save & Publish'}
          </Button>
        </div>
      </form>

      <Dialog open={isSuccessModalOpen} onOpenChange={handleModalClose} modal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift created</DialogTitle>
            <DialogDescription>
              Your shift has been published. Share this link with volunteers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 my-4">
            <Input value={shiftShareUrl(shiftId)} autoFocus />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopyToClipboard}
            >
              <Copy />
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
