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
import { AlertCircleIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ALWAYS_AVAILABLE_SOURCES,
  type DataSourceKey,
  type PlacedField,
  PROFILE_REQUIRED_SOURCES,
} from './builder-types';

interface FieldRowProps {
  field: PlacedField;
  index: number;
  onDataSourceChange: (id: string, source: DataSourceKey | null) => void;
}

function FieldRow({ field, index, onDataSourceChange }: FieldRowProps) {
  const t = useTranslations('Accounting.templates.builder');
  const isUnbound = field.dataSource === null;
  const isProfileRequired =
    field.dataSource !== null &&
    PROFILE_REQUIRED_SOURCES.includes(field.dataSource);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-2.5',
        isUnbound
          ? 'border-destructive bg-destructive/5'
          : 'border-border bg-background',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {t('fieldList.dataSource')} {index + 1}
        </span>
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
            {t('fieldList.profileWarning')}{' '}
            <button
              type="button"
              className="font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              {t('fieldList.configureProfile')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

interface TemplateBuilderFieldListProps {
  fields: PlacedField[];
  onDataSourceChange: (id: string, source: DataSourceKey | null) => void;
  unboundCount: number;
}

export function TemplateBuilderFieldList({
  fields,
  onDataSourceChange,
  unboundCount,
}: TemplateBuilderFieldListProps) {
  const t = useTranslations('Accounting.templates.builder');

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('fieldList.title')}</h2>
        {unboundCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircleIcon size={12} aria-hidden="true" />
            {t('fieldList.unboundCount', { count: unboundCount } as Parameters<typeof t>[1])}
          </span>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('fieldList.emptyHint')}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {fields.map((field, index) => (
            <FieldRow
              key={field.id}
              field={field}
              index={index}
              onDataSourceChange={onDataSourceChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
