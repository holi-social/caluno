'use client';

import { Button, FieldLabel, Input } from '@repo/ui';
import { Plus, X } from 'lucide-react';

export function OptionsEditor({
  value,
  onChange,
  minRows = 2,
  label = 'Optionen',
}: {
  value: string[];
  onChange: (next: string[]) => void;
  minRows?: number;
  label?: string;
}) {
  function update(i: number, next: string) {
    onChange(value.map((o, j) => (j === i ? next : o)));
  }
  function remove(i: number) {
    if (value.length <= minRows) return;
    onChange(value.filter((_, j) => j !== i));
  }
  function add() {
    onChange([...value, '']);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {value.map((opt, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and reorder via splice
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1"
          />
          {value.length > minRows && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => remove(i)}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={add}>
        <Plus className="mr-2 size-4" />
        Option
      </Button>
    </div>
  );
}
