'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrganizationUnit, useRequirementForms } from '@repo/data/react';
import {
  Button,
  Card,
  Checkbox,
  DatePickerWithTimeRange,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Textarea,
} from '@repo/ui';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState, useTransition } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import {
  RequiredFormsAddExisting,
  RequiredFormsDedupHint,
  RequiredFormsList,
} from '@/components/required-forms-fields';
import { FileUpload } from '@/components/storage/file-upload';
import { useRouter } from '@/i18n/navigation';
import {
  type EditShiftInstanceFormValues,
  editShiftInstanceFormSchema,
} from '../schemas';
import { RecurrenceSelect } from './recurrence-select';
import { ShiftInstanceSummaryCard } from './shift-instance-summary-card';

interface EditShiftInstanceFormProps {
  orgUId: string;
  shift: { id: string; title: string; isRecurring: boolean };
  initialValues: Partial<EditShiftInstanceFormValues>;
  initialRequiredFormIds?: string[];
  imagePreviewUrl?: string | null;
  mutate: (
    data: EditShiftInstanceFormValues,
  ) => Promise<{ serverError?: string }>;
}

export const EditShiftInstanceForm = ({
  orgUId,
  shift,
  initialValues,
  initialRequiredFormIds = [],
  imagePreviewUrl,
  mutate,
}: EditShiftInstanceFormProps) => {
  const router = useRouter();
  const t = useTranslations('Shift');
  const tUpload = useTranslations('Storage.upload');
  const tForms = useTranslations('Shift.detail.requiredForms');
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string>();
  const [requiredFormIds, setRequiredFormIds] = useState(
    initialRequiredFormIds,
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const applyAllCheckboxId = useId();

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

  const { open, setOpen } = useFormSheet();

  const schema = editShiftInstanceFormSchema({
    nameRequired: t('validation.nameRequired'),
    startTimeRequired: t('validation.startTimeRequired'),
    endTimeRequired: t('validation.endTimeRequired'),
    minMaxVolunteers: t('validation.minMaxVolunteers'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditShiftInstanceFormValues>({
    resolver: zodResolver(schema) as Resolver<EditShiftInstanceFormValues>,
    defaultValues: {
      location: '',
      instructions: '',
      openShift: true,
      recurrenceDays: [],
      imageFileId: undefined,
      applyToAllFuture: false,
      ...initialValues,
    },
  });

  const isOneTimeShift = !shift.isRecurring;
  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');
  const applyToAllFuture = watch('applyToAllFuture');
  const instanceDate = initialValues.startsAt;

  const onSubmit = async (formData: EditShiftInstanceFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate({ ...formData, requiredFormIds });

      const knownServerErrors: Record<string, string> = {
        shift_instance_time_conflict: t('validation.instanceTimeConflict'),
        shift_instance_date_mismatch: t('validation.instanceDateMismatch'),
        shift_instance_clear_recurrence_unsupported: t(
          'validation.instanceClearRecurrenceUnsupported',
        ),
        shift_instance_recurrence_conflict: t(
          'validation.instanceRecurrenceConflict',
        ),
      };

      if (result.serverError) {
        setServerError(
          knownServerErrors[result.serverError] ?? result.serverError,
        );
        return;
      }

      await setOpen(false);
      router.refresh();
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
      title={t('sheet.editInstanceTitle')}
      description={t('sheet.editInstanceDescription')}
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
    >
      <ShiftInstanceSummaryCard
        title={shift.title}
        startsAt={initialValues.startsAt ?? new Date()}
        endsAt={initialValues.endsAt ?? new Date()}
      >
        {shift.isRecurring && (
          <div className="flex items-start gap-3">
            <Checkbox
              id={applyAllCheckboxId}
              checked={applyToAllFuture}
              onCheckedChange={(checked) =>
                setValue('applyToAllFuture', checked === true, {
                  shouldValidate: true,
                })
              }
              disabled={pending}
            />
            <div className="grid gap-1">
              <FieldLabel htmlFor={applyAllCheckboxId} className="font-normal">
                {t('editInstanceForm.applyToAllLabel')}
              </FieldLabel>
              <FieldDescription>
                {t('editInstanceForm.applyToAllDescription')}
              </FieldDescription>
            </div>
          </div>
        )}
      </ShiftInstanceSummaryCard>

      <Field>
        <FieldLabel htmlFor="name">
          {t('form.nameLabel')} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id="name"
          disabled={pending}
          placeholder={t('form.namePlaceholder')}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>
          {t('form.dateTimeLabel')}
          <span className="text-destructive"> *</span>
        </FieldLabel>
        <DatePickerWithTimeRange
          value={{ start: startsAt ?? null, end: endsAt ?? null }}
          onChange={(start, end) => {
            setValue('startsAt', start as Date, { shouldValidate: true });
            setValue('endsAt', end as Date, { shouldValidate: true });
          }}
          errors={[errors.startsAt?.message, errors.endsAt?.message]}
          disabled={pending}
          minDate={applyToAllFuture ? instanceDate : undefined}
          maxDate={applyToAllFuture ? instanceDate : undefined}
        />
      </Field>

      {applyToAllFuture && (
        <RecurrenceSelect
          value={watch('recurrenceDays')}
          onChange={(days) =>
            setValue(
              'recurrenceDays',
              days as EditShiftInstanceFormValues['recurrenceDays'],
            )
          }
          disabled={pending}
        />
      )}

      <Field>
        <FieldLabel htmlFor="location">{t('form.locationLabel')}</FieldLabel>
        <Input
          id="location"
          disabled={pending}
          placeholder={t('form.locationPlaceholder')}
          aria-invalid={!!errors.location}
          {...register('location')}
        />
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="instructions">
          {t('form.instructionsLabel')}
        </FieldLabel>
        <Textarea
          id="instructions"
          rows={4}
          placeholder={t('form.instructionsPlaceholder')}
          disabled={pending}
          aria-invalid={!!errors.instructions}
          {...register('instructions')}
        />
        {errors.instructions && (
          <FieldError>{errors.instructions.message}</FieldError>
        )}
      </Field>

      {(isOneTimeShift || applyToAllFuture) && (
        <FileUpload
          purpose="shift_image"
          organizationUnitId={orgUId}
          label={t('form.imageLabel')}
          description={tUpload('imageHint')}
          value={watch('imageFileId')}
          initialPreviewUrl={imagePreviewUrl}
          disabled={pending}
          onUploaded={(result) => {
            setValue('imageFileId', result.fileId, { shouldValidate: true });
          }}
          onClear={() => {
            setValue('imageFileId', null, { shouldValidate: true });
          }}
        />
      )}

      {(isOneTimeShift || applyToAllFuture) && (
        <Card className="rounded-md p-4 space-y-3">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="openShift">
                {t('form.openShiftLabel')}
              </FieldLabel>
              <FieldDescription>
                {t('form.openShiftDescription')}
              </FieldDescription>
            </FieldContent>
            <Switch
              id="openShift"
              checked={watch('openShift')}
              onCheckedChange={(checked) => setValue('openShift', checked)}
              disabled={pending}
            />
          </Field>
        </Card>
      )}

      <div className="flex gap-3">
        <Field className="flex-1">
          <FieldLabel htmlFor="minVolunteers">
            {t('form.minVolunteersLabel')}
          </FieldLabel>
          <Input
            id="minVolunteers"
            type="number"
            min={0}
            placeholder={t('form.minVolunteersPlaceholder')}
            disabled={pending}
            {...register('minVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('form.minVolunteersDescription')}
          </FieldDescription>
        </Field>
        <Field className="flex-1">
          <FieldLabel htmlFor="maxVolunteers">
            {t('form.maxVolunteersLabel')}
          </FieldLabel>
          <Input
            id="maxVolunteers"
            type="number"
            min={0}
            placeholder={t('form.maxVolunteersPlaceholder')}
            disabled={pending}
            {...register('maxVolunteers', {
              setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
            })}
          />
          <FieldDescription>
            {t('form.maxVolunteersDescription')}
          </FieldDescription>
          <FieldError errors={[errors.maxVolunteers]} />
        </Field>
      </div>

      {(isOneTimeShift || applyToAllFuture) && (
        <div className="rounded-xl border p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{tForms('title')}</h3>
            <p className="text-sm text-muted-foreground">
              {tForms('subtitle', { shiftTitle: shift.title })}
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
              disabled={
                pending || isLoadingForms || availableForms.length === 0
              }
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
      )}
    </FormSheet>
  );
};
