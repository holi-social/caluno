'use client';

import { Button, Input } from '@repo/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { deriveOptionValue } from '../option-values';

interface OptionItem {
  id: string;
  label: string;
  value: string;
}

function toItems(options: { label: string; value: string }[]): OptionItem[] {
  return options.map((o) => ({ ...o, id: crypto.randomUUID() }));
}

export function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: { label: string; value: string }[];
  onChange: (options: { label: string; value: string }[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('RequirementForm.block');
  const tCommon = useTranslations('Common');
  const [items, setItems] = useState<OptionItem[]>(() => toItems(options));

  function update(
    index: number,
    key: keyof Omit<OptionItem, 'id'>,
    next: string,
  ) {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const merged = { ...item, [key]: next };
      // Keep the value selectable: mirror the label while no value is set.
      if (key === 'label') merged.value = deriveOptionValue(next, item.value);
      return merged;
    });
    setItems(updated);
    onChange(updated.map(({ label, value }) => ({ label, value })));
  }

  function add() {
    const updated = [
      ...items,
      { id: crypto.randomUUID(), label: '', value: '' },
    ];
    setItems(updated);
    onChange(updated.map(({ label, value }) => ({ label, value })));
  }

  function remove(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onChange(updated.map(({ label, value }) => ({ label, value })));
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2">
          <Input
            value={item.label}
            onChange={(e) => update(idx, 'label', e.target.value)}
            placeholder={t('optionLabelPlaceholder', { n: idx + 1 })}
            className="flex-1"
            disabled={disabled}
          />
          <Input
            value={item.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
            placeholder={t('optionValuePlaceholder', { n: idx + 1 })}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive shrink-0"
            tooltip={tCommon('delete')}
            disabled={disabled}
            onClick={() => remove(idx)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={disabled}
      >
        <Plus className="mr-1 size-4" />
        {t('addOption')}
      </Button>
    </div>
  );
}
