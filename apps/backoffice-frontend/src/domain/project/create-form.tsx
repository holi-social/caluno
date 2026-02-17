'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectStatus } from '@repo/data';
import { useOrgId } from '@repo/data/react';
import {
  Button,
  DatePickerWithRange,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';

import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createProject } from '@/domain/project/actions';
import { type CreateProjectFormValues, createProjectSchema } from './schemas';

interface CreateProjectFormProps {
  onSuccess?: () => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps = {}) {
  const params = useParams();
  const orgId = params.orgId as string;
  const organizationId = useOrgId();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      organizationId,
      startsAt: undefined,
      endsAt: undefined,
      status: ProjectStatus.Draft,
    },
  });

  const onSubmit = async (formData: CreateProjectFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createProject(formData);
      if (result?.serverError) {
        setServerError(result.serverError);
      } else {
        onSuccess?.();
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex flex-col h-full"
    >
      <div className="flex-1 pb-20">
        {/* Hidden fields for server action */}
        <input
          type="hidden"
          name="organizationId"
          value={organizationId}
          readOnly
        />
        <input type="hidden" name="orgId" value={orgId} readOnly />

        {/* Title field */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">
              Project Title <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="title"
              type="text"
              disabled={isPending}
              placeholder="Project Title"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            {errors.title && <FieldError>{errors.title.message}</FieldError>}
          </Field>

          {/* Description field */}
          <Field>
            <FieldLabel htmlFor="description">
              Description <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="description"
              rows={8}
              disabled={isPending}
              placeholder="Provide a detailed description of the project..."
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <FieldError>{errors.description.message}</FieldError>
            )}
          </Field>

          {/* Location field */}
          <Field>
            <FieldLabel htmlFor="location">
              Location <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="location"
              type="text"
              disabled={isPending}
              placeholder="123 Main Street, City, State"
              aria-invalid={!!errors.location}
              {...register('location')}
            />
            {errors.location && (
              <FieldError>{errors.location.message}</FieldError>
            )}
          </Field>

          {/* Date range field */}
          <Field>
            <FieldLabel htmlFor="date-picker-range">
              Date Picker Range <span className="text-destructive">*</span>
            </FieldLabel>
            <DatePickerWithRange
              id="date-picker-range"
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
            />
            {errors.startsAt && (
              <FieldError>{errors.startsAt.message}</FieldError>
            )}
            {errors.endsAt && <FieldError>{errors.endsAt.message}</FieldError>}
          </Field>

          {/* Status field */}
          <Field>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <Select
              name="status"
              defaultValue="DRAFT"
              value={watch('status')}
              onValueChange={(value) =>
                setValue('status', value as ProjectStatus)
              }
              disabled={isPending}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {serverError && <FieldError>{serverError}</FieldError>}
        </FieldGroup>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Creating project...' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
