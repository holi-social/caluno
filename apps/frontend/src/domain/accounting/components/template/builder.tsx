'use client';

import { Button } from '@repo/ui';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { TemplateBuilderDesignerMock } from './builder-canvas-designer';
import { TemplateBuilderUploadZone } from './builder-canvas-upload';
import { TemplateBuilderFieldList } from './builder-field-list';
import type { DataSourceKey, PlacedField } from './builder-types';

interface TemplateBuilderProps {
  pauschale: PauschalenType;
  kind: DocumentKind;
  /** mock: pre-populated fields for the "designer active" state */
  initialFields?: PlacedField[];
  backHref?: string;
}

export function TemplateBuilder({
  pauschale,
  kind,
  initialFields,
  backHref,
}: TemplateBuilderProps) {
  const t = useTranslations('Accounting.templates.builder');
  const tSections = useTranslations('Accounting.templates');

  const [hasPdf, setHasPdf] = useState(initialFields !== undefined);
  const [fields, setFields] = useState<PlacedField[]>(initialFields ?? []);
  const unboundCount = hasPdf
    ? fields.filter((f) => f.dataSource === null).length
    : 0;

  const kindLabel = tSections(
    `documentKind.${kind}` as Parameters<typeof tSections>[0],
  );
  const typeLabel = tSections(
    `sections.${pauschale === 'ehrenamt' ? 'ep' : 'ul'}` as Parameters<
      typeof tSections
    >[0],
  );

  function handleFileSelected(_file: File) {
    setHasPdf(true);
  }

  function handleDataSourceChange(id: string, source: DataSourceKey | null) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, dataSource: source } : f)),
    );
  }

  function handleSave() {
    // TODO: persist and navigate back to listing
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3 shrink-0">
        <nav
          className="flex items-center gap-1 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <span>{t('breadcrumb.accounting')}</span>
          <ChevronRightIcon size={14} aria-hidden="true" />
          {backHref ? (
            <Link
              href={backHref}
              className="hover:text-foreground transition-colors"
            >
              {t('breadcrumb.templates')}
            </Link>
          ) : (
            <span>{t('breadcrumb.templates')}</span>
          )}
          <ChevronRightIcon size={14} aria-hidden="true" />
          <span className="text-foreground font-medium">
            {typeLabel} · {kindLabel}
          </span>
        </nav>

        <div className="flex items-center gap-3">
          {hasPdf && unboundCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('fieldList.unboundCount', { count: unboundCount })}
            </span>
          )}
          {hasPdf && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setHasPdf(false)}
            >
              {t('replacePdfButton')}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasPdf || unboundCount > 0}
          >
            {t('saveButton')}
          </Button>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — canvas (~65%) */}
        <div className="flex-[65] p-4 overflow-hidden">
          {hasPdf ? (
            <TemplateBuilderDesignerMock fields={fields} />
          ) : (
            <TemplateBuilderUploadZone onFileSelected={handleFileSelected} />
          )}
        </div>

        {/* Right panel — field list (~35%) */}
        <div className="flex-[35] border-l p-4 overflow-hidden">
          <TemplateBuilderFieldList
            fields={fields}
            pauschale={pauschale}
            onDataSourceChange={handleDataSourceChange}
            unboundCount={unboundCount}
          />
        </div>
      </div>
    </div>
  );
}
