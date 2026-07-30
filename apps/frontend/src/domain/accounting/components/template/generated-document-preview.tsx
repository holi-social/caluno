import { Badge, cn, Separator } from '@repo/ui';
import type { ReactNode } from 'react';
import type { DocumentKind, PauschalenType } from '../doc-type-header';
import { DocTypeHeader } from '../doc-type-header';
import type {
  DataSourceKey,
  TemplateDocument,
  TemplateLine,
} from './builder-types';

interface SignatureLineProps {
  label: string;
  unsignedLabel: string;
}

function SignatureLine({ label, unsignedLabel }: SignatureLineProps) {
  return (
    <div>
      <div className="h-10 border-b" />
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{unsignedLabel}</p>
    </div>
  );
}

/**
 * A value that hasn't been resolved.
 * - `plain` (default): a real generated document missing a value it should have had — bare "—".
 * - `source`: not yet known at this stage (e.g. no volunteer selected yet in the template
 *   builder) — expected, rendered as a neutral dashed chip naming the source.
 * - `gap`: a true profile-data gap (never collected) — the amber "warning" convention.
 */
function Gap({
  variant = 'plain',
  label,
}: {
  variant?: 'plain' | 'source' | 'gap';
  label?: string;
}) {
  if (variant === 'plain' || !label) {
    return (
      <span className="rounded border border-dashed border-alert/50 bg-alert/10 px-1 text-alert">
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        'rounded border border-dashed px-1 font-mono text-xs',
        variant === 'gap'
          ? 'border-alert/50 bg-alert/10 text-alert'
          : 'border-muted-foreground/40 text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

function resolveField(
  field: TemplateLine['fields'][number],
  values: Partial<Record<DataSourceKey, string>>,
  manualOverrides: Record<string, string>,
): string | undefined {
  if (field.value.kind === 'bound') return values[field.value.source];
  return manualOverrides[field.id] ?? (field.value.value || undefined);
}

/** Which `Gap` variant/label an unresolved bound field gets — `plain` when the caller supplies no labels (the creation modals). */
function unresolvedGapProps(
  field: TemplateLine['fields'][number],
  unresolvedLabels: Partial<Record<DataSourceKey, string>>,
  gapSources: Set<DataSourceKey>,
): { variant: 'plain' | 'source' | 'gap'; label?: string } {
  if (field.value.kind !== 'bound') return { variant: 'plain' };
  const label = unresolvedLabels[field.value.source];
  if (!label) return { variant: 'plain' };
  return { variant: gapSources.has(field.value.source) ? 'gap' : 'source', label };
}

function LineRow({
  line,
  values,
  manualOverrides,
  unresolvedLabels,
  gapSources,
}: {
  line: TemplateLine;
  values: Partial<Record<DataSourceKey, string>>;
  manualOverrides: Record<string, string>;
  unresolvedLabels: Partial<Record<DataSourceKey, string>>;
  gapSources: Set<DataSourceKey>;
}) {
  if (!line.enabled) return null;

  // A line that's just one multiline field (the "Sonstiges" freeform block) renders as its own paragraph.
  const [soleField] = line.fields;
  if (line.fields.length === 1 && soleField?.control === 'textarea') {
    const value = resolveField(soleField, values, manualOverrides);
    return (
      <p className="whitespace-pre-wrap text-base leading-relaxed">
        {value || <Gap {...unresolvedGapProps(soleField, unresolvedLabels, gapSources)} />}
      </p>
    );
  }

  const parts = line.text.split(/\{[^}]+\}/g);
  const fields = line.fields;

  return (
    <p className="text-base leading-relaxed">
      {parts.map((part, i) => {
        const field = fields[i];
        const value = field
          ? resolveField(field, values, manualOverrides)
          : undefined;
        return (
          <span key={field?.id ?? 'tail'}>
            {part}
            {field &&
              (value ? (
                value
              ) : (
                <Gap {...unresolvedGapProps(field, unresolvedLabels, gapSources)} />
              ))}
          </span>
        );
      })}
    </p>
  );
}

interface GeneratedDocumentPreviewProps {
  document: TemplateDocument;
  kind: DocumentKind;
  pauschale: PauschalenType;
  pauschaleLabel: string;
  documentTitle: string;
  orgName: string;
  disclaimerLabel: string;
  signerLeftLabel: string;
  signerRightLabel: string;
  unsignedLabel: string;
  values: Partial<Record<DataSourceKey, string>>;
  /** Live per-document edits (contract lifespan, hours/week) — take priority over the template's own stored manual value. */
  manualOverrides?: Record<string, string>;
  /** Real timesheet rows for the invoice table, replacing the builder's blank preview rows. */
  tableRows?: string[][];
  tableTotalRow?: string[];
  /**
   * Label for a bound source with no value yet (e.g. "IBAN (Volunteer)") — used by the
   * template builder, where most sources have no volunteer/period to resolve against.
   * Omit (the creation modals' case) to keep today's bare "—" for any gap.
   */
  unresolvedLabels?: Partial<Record<DataSourceKey, string>>;
  /** Which of `unresolvedLabels`' sources are true profile-data gaps (never collected) — rendered amber instead of neutral. */
  gapSources?: Set<DataSourceKey>;
  className?: string;
}

/**
 * Renders an actual generated document — the same TemplateDocument shape the
 * builder edits, with every bound field resolved to the volunteer/org/period
 * data at hand instead of a builder-thumbnail placeholder chip. Used by both
 * creation modals so what the admin sends is what this preview shows.
 */
export function GeneratedDocumentPreview({
  document: templateDoc,
  kind,
  pauschale,
  pauschaleLabel,
  documentTitle,
  orgName,
  disclaimerLabel,
  signerLeftLabel,
  signerRightLabel,
  unsignedLabel,
  values,
  manualOverrides = {},
  tableRows,
  tableTotalRow,
  unresolvedLabels = {},
  gapSources = new Set(),
  className,
}: GeneratedDocumentPreviewProps) {
  return (
    <div className={className}>
      <div
        className="mx-auto w-full max-w-[820px] rounded-sm border bg-card p-[7%] shadow-sm"
        style={{ aspectRatio: '1 / 1.414' }}
      >
        <div className="flex items-start justify-between gap-4">
          <DocTypeHeader
            kind={kind}
            pauschale={pauschale}
            topLine={pauschaleLabel}
            name={documentTitle}
            subline={orgName}
          />
          <Badge variant="outline">{disclaimerLabel}</Badge>
        </div>

        <Separator className="my-6" />

        <div className="space-y-1 text-center">
          {templateDoc.header.titleLines.map((titleLine, i) => (
            <p
              key={titleLine}
              className={cn(
                i === 0
                  ? 'text-lg font-bold'
                  : 'text-sm font-semibold text-muted-foreground',
              )}
            >
              {titleLine}
            </p>
          ))}
        </div>

        <div className="mt-4 text-right">
          <LineRow
            line={templateDoc.header.orgIdentityLine}
            values={values}
            manualOverrides={manualOverrides}
            unresolvedLabels={unresolvedLabels}
            gapSources={gapSources}
          />
        </div>

        {templateDoc.header.metaLines.length > 0 && (
          <div className="mt-1 text-right">
            {templateDoc.header.metaLines.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                values={values}
                manualOverrides={manualOverrides}
                unresolvedLabels={unresolvedLabels}
                gapSources={gapSources}
              />
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {templateDoc.blocks.map((block): ReactNode => {
            if (block.kind === 'table') {
              const rows = tableRows ?? [];
              return (
                <div key={block.id}>
                  <p className="mb-2 text-sm font-semibold italic text-muted-foreground">
                    {block.title}
                  </p>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        {block.columns.map((col) => (
                          <th
                            key={col}
                            className="border border-border px-2 py-1 text-left font-medium"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={block.columns.length}
                            className="border border-border px-2 py-2 text-center text-muted-foreground"
                          >
                            <Gap />
                          </td>
                        </tr>
                      )}
                      {rows.map((row) => (
                        <tr key={row.join('|')}>
                          {row.map((cell, j) => (
                            <td
                              key={block.columns[j] ?? cell}
                              className="border border-border px-2 py-1"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {tableTotalRow && (
                        <tr className="font-semibold">
                          {tableTotalRow.map((cell, i) => (
                            <td
                              key={block.columns[i] ?? cell}
                              className="border border-border px-2 py-1"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            }

            if (!block.enabled) return null;

            return (
              <div key={block.id}>
                {kind !== 'contract' && (
                  <p className="mb-1 text-sm font-semibold italic text-muted-foreground">
                    {block.title}
                  </p>
                )}
                <div className="space-y-1">
                  {block.lines.map((line) => (
                    <LineRow
                      key={line.id}
                      line={line}
                      values={values}
                      manualOverrides={manualOverrides}
                      unresolvedLabels={unresolvedLabels}
                      gapSources={gapSources}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-6" />

        <LineRow
          line={templateDoc.footer.closingLine}
          values={values}
          manualOverrides={manualOverrides}
          unresolvedLabels={unresolvedLabels}
          gapSources={gapSources}
        />

        {templateDoc.footer.showSignatures && (
          <div className="mt-6 grid grid-cols-2 gap-8">
            <SignatureLine
              label={signerLeftLabel}
              unsignedLabel={unsignedLabel}
            />
            <SignatureLine
              label={signerRightLabel}
              unsignedLabel={unsignedLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
