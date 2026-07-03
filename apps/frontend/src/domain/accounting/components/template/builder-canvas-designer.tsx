'use client';

import { cn } from '@repo/ui';
import type { PlacedField } from './builder-types';

interface TemplateBuilderDesignerMockProps {
  fields: PlacedField[];
}

export function TemplateBuilderDesignerMock({
  fields,
}: TemplateBuilderDesignerMockProps) {
  return (
    <div className="relative h-full overflow-hidden rounded-xl border bg-white">
      {/* Mock PDF background — represents an uploaded A4 document */}
      <div className="absolute inset-0 flex flex-col gap-2 p-6 opacity-10 pointer-events-none select-none">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 rounded-full bg-foreground',
              i % 5 === 0 ? 'w-3/4' : i % 3 === 0 ? 'w-full' : 'w-5/6',
            )}
          />
        ))}
      </div>

      {/* Placed fields */}
      <div className="relative p-6 space-y-3 pointer-events-none">
        {fields.map((field, index) => {
          const isUnbound = field.dataSource === null;
          const label = field.dataSource
            ? field.dataSource
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Not linked';

          return (
            <div
              key={field.id}
              style={{ marginTop: `${index * 8}px` }}
              className={cn(
                'inline-flex items-center rounded border px-2 py-1 text-xs font-mono',
                isUnbound
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-background/90 text-foreground',
              )}
            >
              {isUnbound ? '[Not linked]' : `[${label}]`}
            </div>
          );
        })}
      </div>

      {/* Mock toolbar badge */}
      <div className="absolute top-3 right-3 rounded-md border bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow-sm">
        pdfme Designer (mock)
      </div>
    </div>
  );
}
