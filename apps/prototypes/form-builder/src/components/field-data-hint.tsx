import { Badge } from '@repo/ui';
import { FileText } from 'lucide-react';
import type { FormField } from '@/lib/types';
import { FIELD_TYPE_LABELS } from '@/lib/predefined-fields';

/**
 * Per-field cue inside the builder-side preview.
 * - Choice fields render their options as outline chips.
 * - Document-acknowledgement renders a "Nutzer-Bestätigung" badge above the
 *   uploaded document link (when present).
 * - All other types render an outline badge with the type label.
 */
export function FieldDataHint({ field }: { field: FormField }) {
  if (
    (field.type === 'singlechoice' ||
      field.type === 'multichoice' ||
      field.type === 'select') &&
    field.options &&
    field.options.length > 0
  ) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {FIELD_TYPE_LABELS[field.type]}:
        {field.options.map((opt) => (
          <Badge key={opt.value} variant="outline" className="text-sm">
            {opt.label}
          </Badge>
        ))}
      </div>
    );
  }

  if (field.type === 'document-acknowledgement') {
    return (
      <div className="space-y-3">
        {field.documentUrl && (
          <a
            href={field.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1.5 text-sm hover:underline"
          >
            <FileText className="size-4" />
            {field.documentLabel || field.documentUrl}
          </a>
        )}
        <Badge variant="outline" className="text-sm">
          Nutzer-Bestätigung
        </Badge>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="text-sm">
      {FIELD_TYPE_LABELS[field.type]}
    </Badge>
  );
}
