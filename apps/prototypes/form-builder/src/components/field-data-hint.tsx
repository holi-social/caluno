import type { ReactNode } from 'react';
import { CheckSquare, FileText } from 'lucide-react';
import type { FormField } from '@/lib/types';
import { FIELD_TYPE_LABELS } from '@/lib/predefined-fields';

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="bg-muted/70 text-muted-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

/**
 * Lightweight, non-interactive visual cue describing what data a volunteer
 * would enter for a given field. Used by BlockSummaryPreview to render
 * a builder-side summary; not the volunteer-facing input.
 */
export function FieldDataHint({ field }: { field: FormField }) {
  if (field.type === 'document-acknowledgement') {
    if (field.documentUrl) {
      return (
        <a
          href={field.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
        >
          <FileText className="size-4" />
          {field.documentLabel || field.documentUrl}
        </a>
      );
    }
    return <Pill>Dokument</Pill>;
  }

  if (
    (field.type === 'singlechoice' ||
      field.type === 'multichoice' ||
      field.type === 'select') &&
    field.options &&
    field.options.length > 0
  ) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => (
          <Pill key={opt.value}>{opt.label}</Pill>
        ))}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <CheckSquare className="size-4" />
        {field.placeholder || 'Bestätigen'}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="bg-muted/60 h-14 w-full max-w-sm rounded-md" />
    );
  }

  return <Pill>{FIELD_TYPE_LABELS[field.type]}</Pill>;
}
