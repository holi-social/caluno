import type { Block } from '@/lib/types';
import { DraggableFieldRow } from './builder/draggable-field-row';

/**
 * Inline, builder-side preview of a block's fields. Renders the same shape
 * as the block editor's field rows (border + bg-accent/40 for system fields)
 * but without the interactive controls (no grip, no required toggle, no edit
 * / delete). Required state is surfaced as a small "Pflicht" badge inline
 * with the other tag chips; see `DraggableFieldRow` for that logic.
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
    <div className="space-y-2">
      {block.fields.map((field) => (
        <DraggableFieldRow
          key={field.id}
          field={field}
          canSort={false}
          dragging={false}
        />
      ))}
    </div>
  );
}
