'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { FormBlock, FormBlockField, RequirementForm } from '@repo/data';
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
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  Loader2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { submitForm } from '../actions';

interface VolunteerFormProps {
  form: RequirementForm;
  token: string;
}

export function VolunteerForm({ form, token }: VolunteerFormProps) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

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
        if (
          field.type === 'CHECKBOX' ||
          field.type === 'DOCUMENT_ACKNOWLEDGEMENT'
        ) {
          shape[field.id] = isRequired
            ? z.enum(['true', 'false']).refine((v) => v === 'true', {
                message: `${field.label} is required`,
              })
            : z.enum(['true', 'false']).optional();
        } else if (field.type === 'MULTI_CHOICE') {
          shape[field.id] = isRequired
            ? z.string().min(1, `${field.label} is required`)
            : z.string().optional();
        } else {
          shape[field.id] = isRequired
            ? z.string().min(1, `${field.label} is required`)
            : z.string().optional();
        }
      }
    }
    return z.object(shape);
  }, [blocks]);

  const {
    control,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema) as Resolver<Record<string, string>>,
    defaultValues: {},
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
        setSubmitted(true);
      } else {
        toast.error('Failed to submit form');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit form',
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
          {form.settings?.successTitle || 'Application received!'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {form.settings?.successMessage ||
            'Your application is pending review. An admin will get back to you shortly.'}
        </p>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">This form has no blocks.</p>
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

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {blocks.length}
          </span>
          <span className="text-sm font-medium">{currentBlock.title}</span>
        </div>

        <div className="space-y-4">
          {(currentBlock.fields?.length ?? 0) === 0 && (
            <p className="text-muted-foreground text-sm">
              This block has no fields configured yet.
            </p>
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
              Back
            </Button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.settings?.submitButtonLabel || 'Submit'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormBlockField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  if (field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return (
      <Field>
        <FieldLabel>
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </FieldLabel>
        {field.documentLabel && (
          <FieldDescription>{field.documentLabel}</FieldDescription>
        )}
        <div className="flex items-start gap-2">
          <Checkbox
            id={field.id}
            checked={value === 'true'}
            onCheckedChange={(checked) =>
              onChange(checked === true ? 'true' : 'false')
            }
          />
          <label htmlFor={field.id} className="text-sm">
            I acknowledge and accept
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
          <span className="text-sm">{field.description || 'Yes'}</span>
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
            <SelectValue placeholder="Select an option" />
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
              {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
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
