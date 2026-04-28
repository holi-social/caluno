'use client';

import { Checkbox, FieldError } from '@repo/ui';
import { ExternalLink } from 'lucide-react';
import type { FormField, FieldError as FieldErrorType } from '@/lib/types';

function getDocumentType(url: string): 'pdf' | 'image' | 'unknown' {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(lower)) return 'image';
  return 'unknown';
}

export function DocumentAcknowledgement({
  field,
  checked,
  onChange,
  error,
  showInlinePreview,
}: {
  field: FormField;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: FieldErrorType;
  showInlinePreview?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showInlinePreview && field.documentUrl && (
        <div className="overflow-hidden rounded-md border">
          {getDocumentType(field.documentUrl) === 'pdf' ? (
            <iframe
              src={field.documentUrl}
              className="h-[400px] w-full"
              title={field.label}
            />
          ) : getDocumentType(field.documentUrl) === 'image' ? (
            <img
              src={field.documentUrl}
              alt={field.label}
              className="w-full object-contain"
            />
          ) : (
            <div className="text-muted-foreground bg-muted flex h-[200px] items-center justify-center text-sm">
              Vorschau nicht verfügbar
            </div>
          )}
        </div>
      )}
      <div className="flex items-start gap-3">
        <Checkbox
          id={field.id}
          checked={checked}
          onCheckedChange={(val) => onChange(val === true)}
          aria-invalid={!!error}
        />
        <div className="grid gap-1 leading-snug">
          <label
            htmlFor={field.id}
            className="text-sm font-medium leading-snug cursor-pointer"
          >
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {field.documentUrl && (
            <a
              href={field.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm underline underline-offset-4"
            >
              {field.documentLabel || 'Dokument lesen'}
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
      {error && <FieldError>{error.message}</FieldError>}
    </div>
  );
}
