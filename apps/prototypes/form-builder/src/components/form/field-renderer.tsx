'use client';

import {
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import type { FormField, FieldError as FieldErrorType } from '@/lib/types';
import { DocumentAcknowledgement } from './document-acknowledgement';

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  showDocumentPreview,
}: {
  field: FormField;
  value: string | boolean | string[];
  onChange: (value: string | boolean | string[]) => void;
  error?: FieldErrorType;
  showDocumentPreview?: boolean;
}) {
  if (field.type === 'document-acknowledgement') {
    return (
      <DocumentAcknowledgement
        field={field}
        checked={value === true}
        onChange={onChange}
        error={error}
        showInlinePreview={showDocumentPreview}
      />
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <Checkbox
            id={field.id}
            checked={value === true}
            onCheckedChange={(val) => onChange(val === true)}
            aria-invalid={!!error}
          />
          <div className="grid gap-1 leading-snug">
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-snug cursor-pointer"
            >
              {field.label}
              {field.required && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </label>
            {field.description && (
              <p className="text-muted-foreground text-sm">
                {field.description}
              </p>
            )}
          </div>
        </div>
        {error && <FieldError>{error.message}</FieldError>}
      </div>
    );
  }

  if (field.type === 'multichoice') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <Field data-invalid={!!error || undefined}>
        <FieldLabel>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <div className="space-y-2 pt-1">
          {field.options?.map((opt) => (
            <div key={opt.value} className="flex items-center gap-3">
              <Checkbox
                id={`${field.id}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value);
                  onChange(next);
                }}
              />
              <label
                htmlFor={`${field.id}-${opt.value}`}
                className="text-sm cursor-pointer"
              >
                {opt.label}
              </label>
            </div>
          ))}
        </div>
        {error && <FieldError>{error.message}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'singlechoice') {
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <Field data-invalid={!!error || undefined}>
        <FieldLabel>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <RadioGroup
          value={stringValue}
          onValueChange={(val) => onChange(val)}
          className="pt-1"
        >
          {field.options?.map((opt) => (
            <div key={opt.value} className="flex items-center gap-3">
              <RadioGroupItem
                value={opt.value}
                id={`${field.id}-${opt.value}`}
              />
              <label
                htmlFor={`${field.id}-${opt.value}`}
                className="text-sm cursor-pointer"
              >
                {opt.label}
              </label>
            </div>
          ))}
        </RadioGroup>
        {error && <FieldError>{error.message}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'select') {
    return (
      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor={field.id}>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger id={field.id} className="w-full" aria-invalid={!!error}>
            <SelectValue placeholder={field.placeholder || 'Bitte wählen...'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <FieldError>{error.message}</FieldError>}
      </Field>
    );
  }

  if (field.type === 'textarea') {
    return (
      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor={field.id}>
          {field.label}
          {field.required && (
            <span className="text-destructive ml-0.5">*</span>
          )}
        </FieldLabel>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          rows={4}
        />
        {error && <FieldError>{error.message}</FieldError>}
      </Field>
    );
  }

  // text, vorname, nachname, email, phone, date, password, numbers, iban, plz
  const inputType =
    field.type === 'email'
      ? 'email'
      : field.type === 'phone'
        ? 'tel'
        : field.type === 'date'
          ? 'date'
          : field.type === 'password'
            ? 'password'
            : field.type === 'numbers'
              ? 'number'
              : 'text';

  const inputMode =
    field.type === 'plz' || field.type === 'numbers'
      ? ('numeric' as const)
      : field.type === 'iban'
        ? ('text' as const)
        : undefined;

  const placeholder =
    field.placeholder ??
    (field.type === 'vorname'
      ? 'z.B. Max'
      : field.type === 'nachname'
        ? 'z.B. Mustermann'
        : undefined);

  const pattern =
    field.type === 'vorname' || field.type === 'nachname'
      ? '[\\p{L}\\s\\-]+'
      : undefined;

  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={field.id}>
        {field.label}
        {field.required && (
          <span className="text-destructive ml-0.5">*</span>
        )}
      </FieldLabel>
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <Input
        id={field.id}
        type={inputType}
        inputMode={inputMode}
        placeholder={placeholder}
        pattern={pattern}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <FieldError>{error.message}</FieldError>}
    </Field>
  );
}
