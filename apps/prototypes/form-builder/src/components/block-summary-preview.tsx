import type { Block } from '@/lib/types';
import { FieldDataHint } from './field-data-hint';

/**
 * Inline, builder-side preview of a block: title, description, and
 * a per-field data hint (not volunteer-facing inputs). Reusable; drop
 * anywhere a non-interactive summary of a block's contents is needed.
 */
export function BlockSummaryPreview({ block }: { block: Block }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold">{block.title}</h4>
        {block.description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {block.description}
          </p>
        )}
      </div>
      {block.fields.length > 0 && (
        <ul className="space-y-3 border-l-0">
          {block.fields.map((field) => (
            <li key={field.id} className="space-y-1.5">
              <p className="text-sm font-medium">{field.label}</p>
              <FieldDataHint field={field} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
