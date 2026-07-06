'use client';

import {
  cn,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { AlertCircleIcon, LightbulbIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PauschalenType } from '../doc-type-header';
import {
  ALWAYS_AVAILABLE_SOURCES,
  type DataSourceKey,
  type PlacedField,
  PROFILE_REQUIRED_SOURCES,
} from './builder-types';

interface FieldRowProps {
  field: PlacedField;
  index: number;
  pauschale: PauschalenType;
  onDataSourceChange: (id: string, source: DataSourceKey | null) => void;
}

function FieldRow({ field, index, pauschale, onDataSourceChange }: FieldRowProps) {
  const t = useTranslations('Accounting.templates.builder');
  const tSections = useTranslations('Accounting.templates');
  const pauschaleLabel = tSections(
    `sections.${pauschale === 'ehrenamt' ? 'ep' : 'ul'}` as Parameters<typeof tSections>[0],
  );
  const isUnbound = field.dataSource === null;
  const isProfileRequired =
    field.dataSource !== null &&
    PROFILE_REQUIRED_SOURCES.includes(field.dataSource);

  // TODO: replace with field.name from the pdfme schema once the Designer is mounted.
  // pdfme stores the user-assigned field name (e.g. "InvoiceTo") as schema.name —
  // that is what should appear here as the row title, independent of the data binding.
  // For now we proxy it with the dataSource key (matches what the canvas mock shows
  // in the Field List sidebar) or a generic stub for unbound fields.
  const fieldName = field.dataSource ?? `field_${field.id.slice(0, 4)}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{fieldName}</span>
        {isProfileRequired && field.profileGap && (
          <span className="inline-flex items-center gap-1 rounded-full border border-alert/30 bg-alert/15 px-2 py-0.5 text-xs font-medium text-alert">
            {t('fieldList.requiresCollection')}
          </span>
        )}
        {isUnbound && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircleIcon size={12} aria-hidden="true" />
            {t('fieldList.unbound')}
          </span>
        )}
      </div>

      <Select
        value={field.dataSource ?? ''}
        onValueChange={(val) =>
          onDataSourceChange(field.id, (val as DataSourceKey) || null)
        }
      >
        <SelectTrigger
          className={cn('w-full text-sm', isUnbound && 'border-destructive')}
        >
          <SelectValue placeholder={t('fieldList.unbound')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t('dataSources.groupAlways')}</SelectLabel>
            {ALWAYS_AVAILABLE_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {t(`dataSources.${source}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>{t('dataSources.groupProfile')}</SelectLabel>
            {PROFILE_REQUIRED_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {t(`dataSources.${source}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {field.profileGap && isProfileRequired && (
        <div className="flex items-start gap-1.5 text-xs text-alert">
          <TriangleAlertIcon
            size={12}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>
            {t('fieldList.profileWarningBefore')}{' '}
            <button
              type="button"
              className="font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              {t('fieldList.profileWarningAction')}
            </button>{' '}
            {t('fieldList.profileWarningAfter', { pauschale: pauschaleLabel })}
          </p>
        </div>
      )}
    </div>
  );
}

interface TemplateBuilderFieldListProps {
  fields: PlacedField[];
  pauschale: PauschalenType;
  onDataSourceChange: (id: string, source: DataSourceKey | null) => void;
  unboundCount: number;
}

export function TemplateBuilderFieldList({
  fields,
  pauschale,
  onDataSourceChange,
  unboundCount,
}: TemplateBuilderFieldListProps) {
  const t = useTranslations('Accounting.templates.builder');

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('fieldList.bindingTitle')}</h2>
        {unboundCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircleIcon size={12} aria-hidden="true" />
            {t('fieldList.unboundCount', { count: unboundCount } as Parameters<typeof t>[1])}
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
        <LightbulbIcon size={15} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground leading-snug">
          {t('fieldList.bindingHint')}
        </p>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('fieldList.emptyHint')}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          {fields.map((field, index) => (
            <div key={field.id} className="py-3">
              <FieldRow
                field={field}
                index={index}
                pauschale={pauschale}
                onDataSourceChange={onDataSourceChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
