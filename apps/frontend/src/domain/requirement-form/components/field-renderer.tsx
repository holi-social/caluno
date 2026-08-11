'use client';

import type { FormBlockField } from '@repo/data';
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
import { CalendarIcon, Link } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { z } from 'zod';
import {
  parseMultiChoiceValue,
  serializeMultiChoiceValue,
} from '../option-values';
import { BirthDateInput } from './birth-date-input';

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const NAME_RE = /^[\p{L}\p{M}'\- ]+$/u;
const ZIP_RE = /^[A-Z0-9\- ]{3,10}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;

export const validateIban = (value: string): boolean => {
  const iban = value.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = [...rearranged]
    .map((ch) => (/[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join('');
  let remainder = '';
  for (const digit of numeric) {
    remainder = `${remainder}${digit}`.replace(/^0+/, '');
    const n = Number.parseInt(remainder, 10);
    if (Number.isNaN(n)) return false;
    remainder = (n % 97).toString();
  }
  return remainder === '1';
};

export type ValidationMessages = {
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
  invalidIban: (label: string) => string;
  dateNotFuture: (label: string) => string;
};

export function buildFieldSchema(
  field: RenderableField,
  isRequired: boolean,
  messages: ValidationMessages,
): z.ZodTypeAny {
  const { type, label, systemKey, options, minAge } = field;

  // Controllers default every field to '' — treat it as "no value" so
  // optional enum-based fields (dropdown, checkbox) stay submittable.
  const emptyAsUndefined = (v: unknown) => (v === '' ? undefined : v);

  if (
    type === FieldType.Checkbox ||
    type === FieldType.DocumentAcknowledgement
  ) {
    const base = z.enum(['true', 'false'] as const, {
      message: messages.fieldRequired(label),
    });
    return isRequired
      ? base.refine((v) => v === 'true', {
          message: messages.fieldRequired(label),
        })
      : z.preprocess(emptyAsUndefined, base.optional());
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
    if (systemKey === 'birth-date') {
      s = s.refine(
        (v) => {
          if (!v) return true;
          const d = new Date(v);
          return !Number.isNaN(d.getTime()) && d.getTime() <= Date.now();
        },
        { message: messages.dateNotFuture(label) },
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
      const e = z.enum(vals as [string, ...string[]], {
        message: messages.fieldRequired(label),
      });
      return isRequired ? e : z.preprocess(emptyAsUndefined, e.optional());
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
        (v) =>
          !v ||
          vals.size === 0 ||
          parseMultiChoiceValue(v).every((t) => vals.has(t)),
        { message: messages.invalidOptions(label) },
      );
    return isRequired
      ? s.refine((v) => parseMultiChoiceValue(v).length > 0, {
          message: messages.fieldRequired(label),
        })
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

  if (type === FieldType.Iban || systemKey === 'iban') {
    s = s.refine((v) => !v || validateIban(v), {
      message: messages.invalidIban(label),
    }) as z.ZodString;
  }

  return isRequired
    ? (s as z.ZodString).min(1, messages.fieldRequired(label))
    : s;
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
  | 'documentFileId'
  | 'documentDownloadUrl'
  | 'documentFilename'
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
            {field.documentDownloadUrl ? (
              <span className="flex items-center gap-1">
                <a
                  href={field.documentDownloadUrl}
                  target="_blank"
                  rel="noopener"
                >
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
    const selected = parseMultiChoiceValue(value);
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
                  const next = checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value);
                  onChange(serializeMultiChoiceValue(next));
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
    const labelId = `${field.id}-label`;
    const isBirthDate = field.systemKey === 'birth-date';
    return (
      <Field>
        <FieldLabel id={isBirthDate ? labelId : undefined} htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        {isBirthDate ? (
          <BirthDateInput
            id={field.id}
            value={value}
            onChange={onChange}
            aria-invalid={!!error}
            aria-labelledby={labelId}
          />
        ) : (
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
        )}
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

export const useValidationMessages = (): ValidationMessages => {
  const tValidation = useTranslations('RequirementForm.validation');
  return useMemo<ValidationMessages>(
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
      invalidIban: (label) => tValidation('invalidIban', { label }),
      dateNotFuture: (label) => tValidation('dateNotFuture', { label }),
    }),
    [tValidation],
  );
};
