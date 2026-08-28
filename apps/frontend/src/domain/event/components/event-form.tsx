'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useOrganizationUnit,
  useOrgUId,
  useRequirementForms,
} from '@repo/data/react';
import {
  Button,
  DatePickerWithRange,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from '@repo/ui';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import {
  RequiredFormsAddExisting,
  RequiredFormsDedupHint,
  RequiredFormsList,
} from '@/components/required-forms-fields';
import { FileUpload } from '@/components/storage/file-upload';
import { useRouter } from '@/i18n/navigation';
import { inviteEventPath } from '../routes';
import {
  type EventFormClientValues,
  type EventFormValues,
  eventFormSchema,
} from '../schemas';

interface EventFormProps {
  title: string;
  description: string;
  orgUId: string;
  initialValues?: Partial<EventFormValues>;
  initialRequiredFormIds?: string[];
  logoPreviewUrl?: string | null;
  coverPreviewUrl?: string | null;
  mutate: (
    data: EventFormValues,
  ) => Promise<{ serverError?: string; data?: { id: string } }>;
  redirectToInviteOnCreate?: boolean;
}

export const EventForm = ({
  title,
  description,
  orgUId,
  initialValues = {},
  initialRequiredFormIds = [],
  logoPreviewUrl,
  coverPreviewUrl,
  mutate,
  redirectToInviteOnCreate = false,
}: EventFormProps) => {
  const router = useRouter();
  const organizationUnitId = useOrgUId();
  const t = useTranslations('Event.form');
  const tValidation = useTranslations('Event.form.validation');
  const tUpload = useTranslations('Storage.upload');
  const tForms = useTranslations('Event.detail.requiredForms');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [requiredFormIds, setRequiredFormIds] = useState(
    initialRequiredFormIds,
  );
  const [commandOpen, setCommandOpen] = useState(false);

  const { data: orgUnit } = useOrganizationUnit(orgUId);
  const { data: formsData, isPending: isLoadingForms } = useRequirementForms(
    orgUnit?.organizationId ?? '',
  );

  const requiredForms = useMemo(() => {
    const allForms = formsData?.items ?? [];
    return requiredFormIds
      .map((id) => allForms.find((form) => form.id === id))
      .filter((form): form is NonNullable<typeof form> => Boolean(form));
  }, [requiredFormIds, formsData]);

  const availableForms = useMemo(() => {
    const attachedIds = new Set(requiredFormIds);
    return (formsData?.items ?? []).filter((form) => !attachedIds.has(form.id));
  }, [requiredFormIds, formsData]);

  const disabledFormIds = useMemo(
    () =>
      new Set(
        (formsData?.items ?? [])
          .filter((form) => (form.blockRefs?.length ?? 0) === 0)
          .map((form) => form.id),
      ),
    [formsData],
  );

  const { open, setOpen } = useFormSheet();

  const schema = eventFormSchema({
    titleRequired: tValidation('titleRequired'),
    startRequired: tValidation('startRequired'),
    endRequired: tValidation('endRequired'),
    endAfterStart: tValidation('endAfterStart'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormClientValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      location: '',
      logoFileId: undefined,
      coverFileId: undefined,
      ...initialValues,
    },
  });

  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');

  const onSubmit = async (formData: EventFormClientValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate({
        ...formData,
        requiredFormIds,
      } as EventFormValues);

      if (result.serverError) {
        setServerError(result.serverError);
      } else if (redirectToInviteOnCreate && result.data?.id) {
        const eventId = result.data.id;
        await setOpen(false, () => {
          router.replace(inviteEventPath(orgUId, eventId));
        });
      } else {
        await setOpen(false);
      }
    });
  };

  const handleRemoveForm = (formId: string) => {
    setRequiredFormIds((prev) => prev.filter((id) => id !== formId));
  };

  const handleAddForm = (formId: string) => {
    setRequiredFormIds((prev) => [...prev, formId]);
    setCommandOpen(false);
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
      <Field>
        <FieldLabel htmlFor="event-title">
          {t('titleLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="event-title"
          disabled={pending}
          placeholder={t('titlePlaceholder')}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>
          {t('startsAtLabel')} / {t('endsAtLabel')}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <DatePickerWithRange
          id="event-dates"
          value={{ start: startsAt ?? null, end: endsAt ?? null }}
          onChange={(start, end) => {
            setValue('startsAt', start as Date, { shouldValidate: true });
            setValue('endsAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startsAt?.message, errors.endsAt?.message]}
          includeTime
          disabled={pending}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="event-location">{t('locationLabel')}</FieldLabel>
        <Input
          id="event-location"
          disabled={pending}
          placeholder={t('locationPlaceholder')}
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <FileUpload
        purpose="event_image"
        organizationUnitId={organizationUnitId}
        label={t('logoUrlLabel')}
        description={tUpload('imageHint')}
        value={watch('logoFileId')}
        initialPreviewUrl={logoPreviewUrl}
        disabled={pending}
        onUploaded={(result) => {
          setValue('logoFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('logoFileId', null, { shouldValidate: true });
        }}
      />

      <FileUpload
        purpose="event_image"
        organizationUnitId={organizationUnitId}
        label={t('coverUrlLabel')}
        description={tUpload('imageHint')}
        value={watch('coverFileId')}
        initialPreviewUrl={coverPreviewUrl}
        disabled={pending}
        onUploaded={(result) => {
          setValue('coverFileId', result.fileId, { shouldValidate: true });
        }}
        onClear={() => {
          setValue('coverFileId', null, { shouldValidate: true });
        }}
      />

      <div className="rounded-xl border p-5 space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{tForms('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {tForms('subtitle', {
              eventTitle: watch('title') || initialValues.title || '',
            })}
          </p>
        </div>

        <RequiredFormsList
          forms={requiredForms}
          onRemove={handleRemoveForm}
          removeDisabled={pending}
          t={tForms}
        />

        <div className="flex items-center gap-3">
          <RequiredFormsAddExisting
            availableForms={availableForms}
            onAdd={handleAddForm}
            open={commandOpen}
            onOpenChange={setCommandOpen}
            disabled={pending || isLoadingForms || availableForms.length === 0}
            disabledFormIds={disabledFormIds}
            t={tForms}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              setOpen(false, () => {
                router.push(`/admin/${orgUId}/requirement-forms/new`);
              })
            }
          >
            <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
            {tForms('createNew')}
          </Button>
        </div>

        <RequiredFormsDedupHint t={tForms} />
      </div>
    </FormSheet>
  );
};
