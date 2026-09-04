'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useOrganizationUnit, useRequirementForms } from '@repo/data/react';
import {
  Button,
  Card,
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
import { CalendarClockIcon, SquareArrowOutUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { FormSheet, useFormSheet } from '@/components/form-sheet';
import {
  RequiredFormsAddExisting,
  RequiredFormsDedupHint,
  RequiredFormsList,
} from '@/components/required-forms-fields';
import { FileUpload } from '@/components/storage/file-upload';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { resolveCreateShiftSuccessNavigation } from '../create-shift-flow';
import { shiftInvitePath } from '../routes';
import { type ShiftFormValues, shiftFormSchema } from '../schemas';
import { setSuccessDialogCreatedShift } from '../success-dialog';
import {
  type RecurrenceEndMode,
  RecurrenceEndSelect,
} from './recurrence-end-select';
import { RecurrenceSelect } from './recurrence-select';

interface ShiftFormProps {
  title: string;
  description: string;
  orgUId: string;
  initialValues?: Partial<ShiftFormValues>;
  initialRequiredFormIds?: string[];
  mutate: (data: ShiftFormValues) => Promise<{
    serverError?: string;
    data?: { id: string; instanceId?: string };
  }>;
  defaultLocation?: string;
  redirectToInviteOnCreate?: boolean;
  event?: { title: string; startsAt: Date; endsAt: Date };
  imagePreviewUrl?: string | null;
}

export const ShiftForm = ({
  title,
  description,
  orgUId,
  initialValues,
  initialRequiredFormIds = [],
  mutate,
  defaultLocation,
  redirectToInviteOnCreate = false,
  event,
  imagePreviewUrl,
}: ShiftFormProps) => {
  const router = useRouter();
  const t = useTranslations('Shift');
  const tUpload = useTranslations('Storage.upload');
  const tForms = useTranslations('Shift.detail.requiredForms');
  const { formatRange } = useFormatting();
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

  const schema = shiftFormSchema(
    {
      nameRequired: t('validation.nameRequired'),
      startTimeRequired: t('validation.startTimeRequired'),
      endTimeRequired: t('validation.endTimeRequired'),
      windowViolation: t('validation.windowViolation'),
      minMaxVolunteers: t('validation.minMaxVolunteers'),
      recurrenceEndRequired: t('validation.recurrenceEndRequired'),
      recurrenceEndBeforeStart: t('validation.recurrenceEndBeforeStart'),
    },
    event,
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(schema) as Resolver<ShiftFormValues>,
    defaultValues: {
      name: '',
      location: defaultLocation ?? '',
      instructions: '',
      openShift: true,
      invitedMemberIds: [],
      recurrenceDays: [],
      imageFileId: undefined,
      ...initialValues,
      recurrenceEndMode: initialValues?.recurrenceEndsAt ? 'on' : 'never',
    },
  });

  const startsAt = watch('startsAt');
  const endsAt = watch('endsAt');
  const recurrenceDays = watch('recurrenceDays');
  const recurrenceEndMode = watch('recurrenceEndMode') ?? 'never';
  const recurrenceEndsAt = watch('recurrenceEndsAt');

  const onSubmit = async (formData: ShiftFormValues) => {
    setServerError(undefined);

    startTransition(async () => {
      const result = await mutate({ ...formData, requiredFormIds });

      if (result.serverError === 'shift_window_violation') {
        setError('endsAt', { message: t('validation.windowViolation') });
        return;
      }

      if (result.serverError) {
        setServerError(result.serverError);
        return;
      }

      if (redirectToInviteOnCreate && result.data) {
        const navigation = resolveCreateShiftSuccessNavigation({
          shiftId: result.data.id,
          instanceId: result.data.instanceId,
          openShift: !!formData.openShift,
        });

        if (navigation.action === 'open-invite') {
          await setOpen(false, () => null);
          router.replace(
            shiftInvitePath(orgUId, navigation.shiftId, navigation.instanceId, {
              flow: 'create',
            }),
          );
          router.refresh();
          return;
        }

        if (navigation.action === 'success') {
          setSuccessDialogCreatedShift({
            shiftId: navigation.shiftId,
            instanceId: navigation?.instanceId,
          });
          await setOpen(false);
          router.refresh();
          return;
        }
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
      title={title}
      description={description}
      pending={pending}
      open={open}
      onOpenChange={setOpen}
      formError={serverError}
    >
      {event && (
        <div className="flex gap-2 items-center rounded-md border bg-muted/50 p-3">
          <CalendarClockIcon />
          <div>
            <p className="font-bold">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {t('form.timeRangeConstraint', {
                window: formatRange(event.startsAt, event.endsAt),
              })}
            </p>
          </div>
        </div>
      )}

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

      <div className="space-y-3">
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
            minDate={event?.startsAt}
            maxDate={event?.endsAt}
          />
        </Field>

        <RecurrenceSelect
          value={recurrenceDays}
          onChange={(days) => {
            if (event) return;
            setValue(
              'recurrenceDays',
              days as ShiftFormValues['recurrenceDays'],
            );
            if (days.length === 0) {
              setValue('recurrenceEndMode', 'never', { shouldValidate: true });
              setValue('recurrenceEndsAt', undefined, { shouldValidate: true });
            }
          }}
          disabled={!!event || pending}
        />

        {(recurrenceDays?.length ?? 0) > 0 && (
          <RecurrenceEndSelect
            mode={recurrenceEndMode}
            date={recurrenceEndsAt}
            minDate={startsAt}
            error={errors.recurrenceEndsAt?.message}
            disabled={!!event || pending}
            onModeChange={(mode: RecurrenceEndMode) => {
              setValue('recurrenceEndMode', mode, { shouldValidate: true });
              if (mode === 'never') {
                setValue('recurrenceEndsAt', undefined, {
                  shouldValidate: true,
                });
              }
            }}
            onDateChange={(date) => {
              setValue('recurrenceEndsAt', date, { shouldValidate: true });
            }}
          />
        )}
      </div>

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

      <div className="rounded-xl border p-5 space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{tForms('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {tForms('subtitle', {
              shiftTitle: watch('name') || initialValues?.name || '',
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
