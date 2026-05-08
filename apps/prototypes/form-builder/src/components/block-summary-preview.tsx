import { Badge, Card, CardContent } from '@repo/ui';
import type { Block } from '@/lib/types';
import { FieldDataHint } from './field-data-hint';

/**
 * Inline, builder-side preview of a block's fields. Renders one shadow-less
 * card per field (label, optional description, type badge / document link).
 * Reusable; drop wherever a non-interactive summary is needed.
 */
export function BlockSummaryPreview({ block }: { block: Block }) {
  if (block.fields.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Felder in diesem Block.
      </p>
    );
  }

  return (
    <div>
      {block.fields.map((field) => (
        <Card
          key={field.id}
          className="bg-muted/40 mb-2 border-none shadow-none last:mb-0"
        >
          <CardContent className="space-y-1.5 px-6 py-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{field.label}</p>
              {field.required && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  Pflicht
                </Badge>
              )}
            </div>
            {field.description && (
              <p className="text-muted-foreground text-sm">
                {field.description}
              </p>
            )}
            <div className="pt-1">
              <FieldDataHint field={field} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
