'use client';

import { Badge } from '@repo/ui';
import type { FormField } from '@/lib/types';
import {
  FIELD_TYPE_LABELS,
  getFieldDisplayLabel,
} from '@/lib/predefined-fields';

export function FieldBadge({ field }: { field: FormField }) {
  return (
    <Badge variant="outline" className="text-xs">
      {getFieldDisplayLabel(field)}
      {field.required && <span className="text-destructive ml-0.5">*</span>}
    </Badge>
  );
}

export function FieldTypeLabel({ type }: { type: string }) {
  return FIELD_TYPE_LABELS[type as keyof typeof FIELD_TYPE_LABELS] || type;
}
