'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type {
  FormBlock,
  FormBlockField,
  GetRequirementFormByShareTokenQuery,
} from '@repo/data';
import { FieldType } from '@repo/data';
import {
  Button,
  Calendar,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  Link,
  Loader2,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { submitForm } from '../actions';

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const NAME_RE = /^[\p{L}\p{M}'\- ]+$/u;
const ZIP_RE = /^[A-Z0-9\- ]{3,10}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;

interface ValidationMessages {
  fieldRequired: (label: string) => string;
  mustBeNumber: (label: string) => string;
  mustBeValidDate: (label: string) => string;
  mustBeValidEmail: (label: string) => string;
  mustBeValidPhone: (label: string) => string;
  invalidOptions: (label: string) => string;
  maxChars: (label: string, maxLen: number) => string;
  invalidCharacters: (label: string) => string;
  validPostalCode: (label: string) => string;
  minAge: (minAge: number) => string;
}

export function buildFieldSchema(
  field: RenderableField,
  isRequired: boolean,
  messages: ValidationMessages,
): z.ZodTypeAny {
  const { type, label, systemKey, options, minAge } = field;

  if (
    type === FieldType.Checkbox ||
    type === FieldType.DocumentAcknowledgement
  ) {
    const base = z.enum(['true', 'false'] as const);
    return isRequired
      ? base.refine((v) => v === 'true', {
          message: messages.fieldRequired(label),
        })
      : base.optional();
  }

  if (type === FieldType.StaticText) {
    return z.string().optional();
  }

  if (type === FieldType.Numbers) {
    return isRequired
      ? z
          .string()
          .min(1, messages.fieldRequired(label))
          .regex(NUM_RE, messages.mustBeNumber(label))
      : z.string().refine((v) => !v || NUM_RE.test(v), {
          message: messages.mustBeNumber(label),
        });
  }

  if (type === FieldType.Date) {
    let s = isRequired
      ? z
          .string()
          .min(1, messages.fieldRequired(label))
          .refine((v) => !Number.isNaN(Date.parse(v)), {
            message: messages.mustBeValidDate(label),
          })
      : z.string().refine((v) => !v || !Number.isNaN(Date.parse(v)), {
          message: messages.mustBeValidDate(label),
        });
    if (minAge != null) {
      const requiredAge = minAge;
      s = s.refine(
        (v) => {
          if (!v) return true;
          const birth = new Date(v);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          if (
            today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() &&
              today.getDate() < birth.getDate())
          ) {
            age--;
          }
          return age >= requiredAge;
        },
        { message: messages.minAge(minAge) },
      );
    }
    return s;
  }

  if (type === FieldType.Email) {
    return isRequired
      ? z
          .string()
          .min(1, messages.fieldRequired(label))
          .regex(EMAIL_RE, messages.mustBeValidEmail(label))
          .max(254)
      : z.string().refine((v) => !v || (EMAIL_RE.test(v) && v.length <= 254), {
          message: messages.mustBeValidEmail(label),
        });
  }

  if (type === FieldType.Phone) {
    return isRequired
      ? z
          .string()
          .min(1, messages.fieldRequired(label))
          .regex(PHONE_RE, messages.mustBeValidPhone(label))
      : z.string().refine((v) => !v || PHONE_RE.test(v), {
          message: messages.mustBeValidPhone(label),
        });
  }

  if (type === FieldType.SingleChoice) {
    const vals = (options ?? []).map((o) => o.value);
    if (vals.length > 0) {
      const e = z.enum(vals as [string, ...string[]]);
      return isRequired ? e : e.optional();
    }
    return isRequired
      ? z.string().min(1, messages.fieldRequired(label))
      : z.string().optional();
  }

  if (type === FieldType.MultiChoice) {
    const vals = new Set((options ?? []).map((o) => o.value));
    const s = z
      .string()
      .refine(
        (v) => !v || vals.size === 0 || v.split(',').every((t) => vals.has(t)),
        { message: messages.invalidOptions(label) },
      );
    return isRequired
      ? s.refine((v) => !!v, { message: messages.fieldRequired(label) })
      : s;
  }

  // Text-like: TEXT, NAME, LASTNAME, ZIP, IBAN, TEXTAREA
  const maxLen =
    type === FieldType.Textarea
      ? 5000
      : type === FieldType.Name || type === FieldType.Lastname
        ? 100
        : type === FieldType.Zip
          ? 20
          : type === FieldType.Iban
            ? 34
            : 300; // TEXT and anything else
  let s = z.string().max(maxLen, messages.maxChars(label, maxLen));

  // System-key extra rules (applied regardless of FieldType for defensive coverage)
  const sk = systemKey ?? '';
  if (
    sk === 'name' ||
    sk === 'lastname' ||
    sk === 'preferred-name' ||
    sk === 'city'
  ) {
    s = s
      .max(100, messages.maxChars(label, 100))
      .refine((v) => !v || NAME_RE.test(v), {
        message: messages.invalidCharacters(label),
      }) as z.ZodString;
  } else if (sk === 'email') {
    s = s
      .regex(EMAIL_RE, messages.mustBeValidEmail(label))
      .max(254) as z.ZodString;
  } else if (sk === 'phone') {
    s = s.refine((v) => !v || PHONE_RE.test(v), {
      message: messages.mustBeValidPhone(label),
    }) as z.ZodString;
  } else if (sk === 'address') {
    s = s.max(200, messages.maxChars(label, 200)) as z.ZodString;
  } else if (sk === 'zip') {
    s = s.refine((v) => !v || ZIP_RE.test(v), {
      message: messages.validPostalCode(label),
    }) as z.ZodString;
  } else if (sk === 'gender') {
    s = s.max(50, messages.maxChars(label, 50)) as z.ZodString;
  }

  return isRequired
    ? (s as z.ZodString).min(1, messages.fieldRequired(label))
    : s;
}

export type PublicForm = NonNullable<
  GetRequirementFormByShareTokenQuery['requirementFormByShareToken']
>;

interface VolunteerFormProps {
  form: PublicForm;
  token: string;
  isMember?: boolean;
  orgName?: string;
  profileData?: Record<string, string>;
}

export function VolunteerForm({
  form,
  token,
  isMember = true,
  orgName,
  profileData = {},
}: VolunteerFormProps) {
  const router = useRouter();
  const t = useTranslations('RequirementForm.volunteerForm');
  const tActions = useTranslations('RequirementForm.actions');
  const tValidation = useTranslations('RequirementForm.validation');
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const validationMessages = useMemo<ValidationMessages>(
    () => ({
      fieldRequired: (label) => tValidation('fieldRequired', { label }),
      mustBeNumber: (label) => tValidation('mustBeNumber', { label }),
      mustBeValidDate: (label) => tValidation('mustBeValidDate', { label }),
      mustBeValidEmail: (label) => tValidation('mustBeValidEmail', { label }),
      mustBeValidPhone: (label) => tValidation('mustBeValidPhone', { label }),
      invalidOptions: (label) => tValidation('invalidOptions', { label }),
      maxChars: (label, maxLen) => tValidation('maxChars', { label, maxLen }),
      invalidCharacters: (label) => tValidation('invalidCharacters', { label }),
      validPostalCode: (label) => tValidation('validPostalCode', { label }),
      minAge: (minAge) => tValidation('minAge', { minAge }),
    }),
    [tValidation],
  );

  const blocks = useMemo(() => {
    return (
      form.blockRefs
        ?.map((ref) => {
          const block = ref.block;
          if (!block) return null;
          return {
            ...block,
            effectiveRequired: ref.required ?? block.required,
          };
        })
        .filter((b): b is FormBlock & { effectiveRequired: boolean } => !!b) ??
      []
    );
  }, [form.blockRefs]);

  const currentBlock = blocks[step];
  const isLastStep = step === blocks.length - 1;
  const isFirstStep = step === 0;

  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const block of blocks) {
      for (const field of block.fields ?? []) {
        const isRequired = block.effectiveRequired && field.required;
        shape[field.id] = buildFieldSchema(
          field,
          isRequired,
          validationMessages,
        );
      }
    }
    return z.object(shape);
  }, [blocks, validationMessages]);

  const defaultValues = useMemo(() => {
    const vals: Record<string, string> = {};
    for (const block of blocks) {
      for (const field of block.fields ?? []) {
        if (field.systemKey && profileData[field.systemKey]) {
          vals[field.id] = profileData[field.systemKey] ?? '';
        }
      }
    }
    return vals;
  }, [blocks, profileData]);

  const {
    control,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema) as Resolver<Record<string, string>>,
    defaultValues,
    mode: 'onChange',
  });

  async function handleNext() {
    if (!currentBlock) return;
    const fieldIds = (currentBlock.fields ?? []).map((f) => f.id);
    const valid = await trigger(fieldIds);
    if (valid) {
      setStep((s) => s + 1);
    }
  }

  async function handleSubmit() {
    if (!currentBlock) return;
    const fieldIds = (currentBlock.fields ?? []).map((f) => f.id);
    const valid = await trigger(fieldIds);
    if (!valid) return;

    const values = getValues();
    const submissionValues = Object.entries(values).map(([fieldId, value]) => {
      let blockId = '';
      for (const block of blocks) {
        const field = block.fields?.find((f) => f.id === fieldId);
        if (field) {
          blockId = block.id;
          break;
        }
      }
      return { fieldId, blockId, value: value ?? '' };
    });

    try {
      const result = await submitForm({
        token,
        values: submissionValues,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data) {
        if (!isMember) {
          router.push('/profile#memberships');
        } else {
          setSubmitted(true);
        }
      } else {
        toast.error(tActions('failedToSubmitForm'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tActions('failedToSubmitForm'),
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">
          {form.settings?.successTitle || t('successTitle')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {form.settings?.successMessage || t('successMessage')}
        </p>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">{t('noBlocks')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-bold">{form.name}</h1>
        {form.description && (
          <p className="mt-1 text-muted-foreground">{form.description}</p>
        )}
      </div>

      {!isMember && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-800">
          {t('membershipRequestNotice', { orgName: orgName ?? form.name })}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('step', { current: step + 1, total: blocks.length })}
          </span>
          <span className="text-sm font-medium">{currentBlock.title}</span>
        </div>

        <div className="space-y-4">
          {(currentBlock.fields?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">{t('noFields')}</p>
          )}
          {currentBlock.fields?.map((field) => (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              defaultValue=""
              render={({ field: ctrlField }) => (
                <FieldRenderer
                  field={field}
                  value={ctrlField.value ?? ''}
                  onChange={ctrlField.onChange}
                  error={errors[field.id]?.message}
                />
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!isFirstStep ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.settings?.submitButtonLabel || t('submit')}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {t('next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export type RenderableField = Pick<
  FormBlockField,
  | 'id'
  | 'type'
  | 'label'
  | 'required'
  | 'description'
  | 'placeholder'
  | 'systemKey'
  | 'options'
  | 'documentUrl'
  | 'documentLabel'
  | 'minAge'
>;

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: RenderableField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const t = useTranslations('RequirementForm.volunteerForm');
  const formatter = useFormatter();

  if (field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.documentLabel && (
          <FieldDescription>
            {field.documentUrl ? (
              <span className="flex items-center gap-1">
                <a href={field.documentUrl} target="_blank" rel="noopener">
                  {field.documentLabel}
                </a>
                <Link className="size-3" />
              </span>
            ) : (
              field.documentLabel
            )}
          </FieldDescription>
        )}
        <div className="flex gap-2 items-center">
          <Checkbox
            id={field.id}
            checked={value === 'true'}
            onCheckedChange={(checked) =>
              onChange(checked === true ? 'true' : 'false')
            }
          />
          <label htmlFor={field.id} className="text-sm">
            {t('documentAcknowledgement')}
          </label>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'CHECKBOX') {
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        <div className="flex items-start gap-2">
          <Checkbox
            checked={value === 'true'}
            onCheckedChange={(checked) =>
              onChange(checked === true ? 'true' : 'false')
            }
          />
          <span className="text-sm">
            {field.description || t('checkboxYes')}
          </span>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'SINGLE_CHOICE') {
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('selectOption')} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'MULTI_CHOICE') {
    const selected = value ? value.split(',') : [];
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm"
              htmlFor={`${field.id}-${opt.value}`}
            >
              <Checkbox
                id={`${field.id}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, opt.value].join(','));
                  } else {
                    onChange(selected.filter((v) => v !== opt.value).join(','));
                  }
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'DATE') {
    const dateValue = value ? new Date(value) : undefined;
    return (
      <Field>
        <FieldLabel htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 size-4" />
              {dateValue
                ? formatter.dateTime(dateValue, { dateStyle: 'long' })
                : t('pickDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => onChange(date ? date.toISOString() : '')}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'TEXTAREA') {
    return (
      <Field>
        <FieldLabel htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Textarea
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={4}
          aria-invalid={!!error}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  const inputType =
    field.type === 'EMAIL'
      ? 'email'
      : field.type === 'NUMBERS'
        ? 'number'
        : 'text';

  return (
    <Field>
      <FieldLabel htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Input
        id={field.id}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        aria-invalid={!!error}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
