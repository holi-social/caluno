'use client';

import { ProjectStatus } from '@repo/data';
import { DatePickerWithRange } from '@repo/ui';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/ui/base/field';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Textarea } from '@repo/ui/textarea';
import { useParams } from 'next/navigation';
import { useActionState, useState } from 'react';
import { createProject } from '@/actions/project';

function formatValidationErrors(
  errors: string[] | undefined,
): { message?: string }[] {
  if (!errors) return [];
  return errors.map((error) => ({ message: error }));
}

export function CreateProjectForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [state, formAction, isPending] = useActionState(createProject, {
    success: false,
    data: {
      title: '',
      description: '',
      location: '',
      startsAt: '',
      endsAt: '',
      organizationId: '',
      status: ProjectStatus.Active,
    },
    error: undefined,
    validationErrors: undefined,
  });
  const fieldErrors = state?.validationErrors?.fieldErrors;
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >();

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields for server action */}
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {/* Error display */}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Title field */}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">
            Project Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="title"
            name="title"
            type="text"
            defaultValue={state?.data?.title}
            className="mt-1"
            placeholder="Community Garden Renovation"
            disabled={isPending}
            aria-invalid={!!fieldErrors?.title}
          />
          <FieldError errors={formatValidationErrors(fieldErrors?.title)} />
        </Field>

        {/* Description field */}
        <Field>
          <FieldLabel htmlFor="description">
            Description <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="description"
            name="description"
            defaultValue={state?.data?.description}
            className="mt-1"
            placeholder="Provide a detailed description of the project..."
            rows={4}
            disabled={isPending}
            aria-invalid={!!fieldErrors?.description}
          />
          <FieldError
            errors={formatValidationErrors(fieldErrors?.description)}
          />
        </Field>

        {/* Location field */}
        <Field>
          <FieldLabel htmlFor="location">
            Location <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="location"
            name="location"
            type="text"
            defaultValue={state?.data?.location}
            className="mt-1"
            placeholder="123 Main Street, City, State"
            disabled={isPending}
            aria-invalid={!!fieldErrors?.location}
          />
          <FieldError errors={formatValidationErrors(fieldErrors?.location)} />
        </Field>

        {/* Date range field */}
        <DatePickerWithRange
          dateRange={dateRange}
          setDateRange={(dateRange) =>
            setDateRange(dateRange as { from: Date; to: Date } | undefined)
          }
          errors={formatValidationErrors(
            [fieldErrors?.startsAt ?? [], fieldErrors?.endsAt ?? []].flat(),
          )}
        />

        {/* Status field */}
        <Field>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <Select name="status" defaultValue="DRAFT" disabled={isPending}>
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
      </FieldGroup>

      {/* Submit button */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating project...' : 'Create project'}
      </Button>
    </form>
  );
}
