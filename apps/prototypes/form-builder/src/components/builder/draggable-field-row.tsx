'use client';

import { Badge, Button, Switch, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { GripVertical, Pencil, Trash2, UserCircle2 } from 'lucide-react';
import type { FormField } from '@/lib/types';
import { FIELD_TYPE_LABELS } from '@/lib/predefined-fields';
import { isSystemRequirement } from '@/lib/system-requirements';

export function DraggableFieldRow({
  field,
  canSort,
  dragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onToggleRequired,
  onEdit,
  onDelete,
}: {
  field: FormField;
  canSort: boolean;
  dragging: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (overId: string) => void;
  onToggleRequired?: (next: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isSystemField = isSystemRequirement(field);
  return (
    <div
      className={[
        'group flex items-center gap-3 rounded-lg border px-4 py-3',
        dragging ? 'bg-muted/40 shadow-sm' : '',
        isSystemField && !dragging ? 'bg-accent/40' : '',
      ].join(' ')}
      onDragOver={(e) => {
        if (!canSort) return;
        e.preventDefault();
        onDragOver?.(field.id);
      }}
      onDrop={(e) => {
        if (!canSort) return;
        e.preventDefault();
      }}
    >
      <button
        type="button"
        className="text-muted-foreground cursor-grab active:cursor-grabbing"
        aria-label="Feld verschieben"
        draggable={canSort}
        onDragStart={() => onDragStart?.()}
        onDragEnd={() => onDragEnd?.()}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-stretch gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={!onEdit}
          className="hover:bg-muted/60 disabled:hover:bg-transparent -my-2 min-w-0 flex-1 rounded-md px-2 py-2 text-left disabled:cursor-default"
        >
          <div className="flex flex-wrap items-center gap-2">
            {isSystemField && (
              <UserCircle2 className="text-muted-foreground size-4 shrink-0" />
            )}
            <span className="text-sm font-medium">{field.label}</span>
            <Badge variant="outline" className="text-sm">
              {FIELD_TYPE_LABELS[field.type] ?? field.type}
            </Badge>
            {isSystemField && (
              <Badge variant="secondary" className="text-sm">
                Systemfeld
              </Badge>
            )}
          </div>
          {field.description && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {field.description}
            </p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            {field.required ? 'Pflichtig' : 'Optional'}
          </span>
          {isSystemField ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    size="sm"
                    checked
                    disabled
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Systemfelder sind immer Pflichtfelder.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Switch
              size="sm"
              checked={field.required}
              onCheckedChange={(checked) => onToggleRequired?.(checked)}
              disabled={!onToggleRequired}
            />
          )}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = array.slice();
  const [item] = next.splice(from, 1) as [T];
  next.splice(to, 0, item);
  return next;
}
