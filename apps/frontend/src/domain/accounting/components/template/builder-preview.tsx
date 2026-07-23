'use client';

import { cn } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { DocumentKind } from '../doc-type-header';
import type {
  DataSourceKey,
  TemplateDocument,
  TemplateField,
  TemplateLine,
} from './builder-types';

interface FieldChipProps {
  field: TemplateField;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
}

function FieldChip({ field, profileGaps, knownValues }: FieldChipProps) {
  const t = useTranslations('Accounting.templates.builder');

  if (field.value.kind === 'manual-template') {
    const value = field.value.value.trim();
    return (
      <span
        className={cn(
          'rounded border px-1 font-mono text-[10px]',
          value
            ? 'border-border bg-muted text-foreground'
            : 'border-dashed border-alert/50 bg-alert/10 text-alert',
        )}
      >
        {value || '…'}
      </span>
    );
  }

  const isGap = profileGaps.has(field.value.source);
  const known = knownValues[field.value.source];

  if (known && !isGap) {
    return (
      <span className="rounded border border-border bg-muted px-1 font-mono text-[10px] text-foreground">
        {known}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'rounded border border-dashed px-1 font-mono text-[10px]',
        isGap
          ? 'border-alert/50 bg-alert/10 text-alert'
          : 'border-muted-foreground/40 text-muted-foreground',
      )}
    >
      {t(`dataSources.${field.value.source}` as Parameters<typeof t>[0])}
    </span>
  );
}

function LineRow({
  line,
  profileGaps,
  knownValues,
}: {
  line: TemplateLine;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
}) {
  if (!line.enabled) return null;

  // A line that's just one multiline field (the "Sonstiges" freeform block) renders as its
  // own paragraph, not an inline chip — it's prose, not a short inline value.
  const [soleField] = line.fields;
  if (line.fields.length === 1 && soleField?.control === 'textarea') {
    const value =
      soleField.value.kind === 'manual-template'
        ? soleField.value.value.trim()
        : '';
    return (
      <p className="whitespace-pre-wrap text-[9px] leading-relaxed text-zinc-700">
        {value || <span className="text-muted-foreground">…</span>}
      </p>
    );
  }

  const parts = line.text.split(/\{[^}]+\}/g);
  const fields = line.fields;

  return (
    <p className="text-[9px] leading-relaxed text-zinc-700">
      {parts.map((part, i) => (
        <span key={fields[i]?.id ?? 'tail'}>
          {part}
          {fields[i] && (
            <>
              {' '}
              <FieldChip
                field={fields[i]}
                profileGaps={profileGaps}
                knownValues={knownValues}
              />{' '}
            </>
          )}
        </span>
      ))}
    </p>
  );
}

interface TemplateBuilderPreviewProps {
  document: TemplateDocument;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  kind: DocumentKind;
}

export function TemplateBuilderPreview({
  document: templateDoc,
  profileGaps,
  knownValues,
  kind,
}: TemplateBuilderPreviewProps) {
  const t = useTranslations('Accounting.templates.builder');

  return (
    <section
      className="h-full min-h-0 overflow-y-auto rounded-lg bg-muted/40 p-12 [mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-2rem),transparent_100%)]"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 requires this independently-scrollable region to be keyboard-reachable (axe "scrollable-region-focusable").
      tabIndex={0}
      aria-label={t('previewScrollRegionLabel')}
    >
      <div
        className="w-full border border-border bg-white p-[6%]"
        style={{ aspectRatio: '1 / 1.414' }}
      >
        {/* Header */}
        <div className="mb-[4%] flex items-start justify-between gap-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-zinc-300 text-[7px] text-zinc-400"
            aria-hidden="true"
          >
            Logo
          </div>
          <div className="text-right">
            <LineRow
              line={templateDoc.header.orgIdentityLine}
              profileGaps={profileGaps}
              knownValues={knownValues}
            />
          </div>
        </div>

        <div className="mb-[4%] space-y-0.5 text-center">
          {templateDoc.header.titleLines.map((titleLine, i) => (
            <p
              key={titleLine}
              className={cn(
                'text-zinc-800',
                i === 0 ? 'text-[11px] font-bold' : 'text-[8px] font-semibold',
              )}
            >
              {titleLine}
            </p>
          ))}
        </div>

        {templateDoc.header.metaLines.length > 0 && (
          <div className="mb-[4%] space-y-0.5 text-right">
            {templateDoc.header.metaLines.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                profileGaps={profileGaps}
                knownValues={knownValues}
              />
            ))}
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-[3%]">
          {templateDoc.blocks.map((block) => {
            if (block.kind === 'table') {
              return (
                <div key={block.id}>
                  <p className="mb-1 text-[8px] font-semibold italic text-zinc-600">
                    {block.title}
                  </p>
                  <table className="w-full border-collapse text-[7px]">
                    <thead>
                      <tr className="bg-teal-700 text-white">
                        {block.columns.map((col) => (
                          <th
                            key={col}
                            className="border border-zinc-200 px-1 py-0.5 text-left font-medium"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(
                        { length: block.previewRowCount },
                        (_, i) => `${block.id}-row-${i}`,
                      ).map((rowId) => (
                        <tr key={rowId}>
                          {block.columns.map((col) => (
                            <td
                              key={col}
                              className="border border-zinc-100 px-1 py-0.5 text-zinc-300"
                            >
                              &nbsp;
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td
                          colSpan={block.columns.length - 2}
                          className="border border-zinc-200 px-1 py-0.5 text-right text-zinc-500"
                        >
                          Summe
                        </td>
                        <td className="border border-zinc-200 px-1 py-0.5 text-zinc-400">
                          —
                        </td>
                        <td className="border border-zinc-200 px-1 py-0.5 text-zinc-400">
                          —
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            }

            if (!block.enabled) return null;

            return (
              <div key={block.id}>
                {kind !== 'contract' && (
                  <p className="mb-1 text-[8px] font-semibold italic text-zinc-600">
                    {block.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {block.lines.map((line) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      profileGaps={profileGaps}
                      knownValues={knownValues}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-[4%] space-y-[6%]">
          <LineRow
            line={templateDoc.footer.closingLine}
            profileGaps={profileGaps}
            knownValues={knownValues}
          />
          {templateDoc.footer.showSignatures && (
            <div className="flex items-end justify-between text-[8px] text-zinc-500">
              <div className="w-[40%] border-t border-zinc-400 pt-0.5 text-center">
                Unterschrift ehrenamtlich tätige Person
              </div>
              <div className="w-[40%] border-t border-zinc-400 pt-0.5 text-center">
                Unterschrift Vorstand/Organisation
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
