import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  DatePickerWithRange,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@repo/ui';
import { useForm } from 'react-hook-form';
import { type ShiftFormValues, shiftFormSchema } from '../schemas';
import { InviteList } from './invite-list';

type FormProps = {
  organizationId: string;
  onSubmit: (formData: ShiftFormValues) => void;
  isPending?: boolean;
  initialValues?: ShiftFormValues;
};

export const ShiftForm = ({
  organizationId,
  onSubmit,
  isPending = false,
  initialValues,
}: FormProps) => {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      ...{
        name: '',
        location: '',
        instructions: '',
        openShift: true,
        organizationId,
        invitedMemberIds: [],
      },
      ...initialValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Field>
        <FieldLabel htmlFor="startToEnd">
          Start → End <span className="text-destructive">*</span>
        </FieldLabel>
        <DatePickerWithRange
          includeTime
          id="startToEnd"
          value={{
            from: watch('startsAt') ? watch('startsAt') : undefined,
            to: watch('endsAt') ? watch('endsAt') : undefined,
          }}
          aria-invalid={!!errors.startsAt || !!errors.endsAt}
          onChange={(dateRange) => {
            setValue('startsAt', dateRange?.from as Date, {
              shouldValidate: true,
            });
            setValue('endsAt', dateRange?.to as Date, {
              shouldValidate: true,
            });
          }}
          placeholder="Shift start to end time"
        />
        {errors.startsAt && <FieldError>{errors.startsAt.message}</FieldError>}
        {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="location">Location</FieldLabel>
        <Input
          id="location"
          disabled={isPending}
          placeholder="Main Hall, 123 Main St"
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
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
  );
};
