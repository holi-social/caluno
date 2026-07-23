'use client';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { LockIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type { DocumentKind } from '../doc-type-header';
import { TemplateBuilderMonthYearPicker } from './builder-month-year-picker';
import {
  type DataSourceKey,
  FIELD_ORIGIN,
  getFirstOccurrenceLineByFieldId,
  type InvoiceNumberFormat,
  type TemplateBlock,
  type TemplateDocument,
  type TemplateField,
  type TemplateLine,
  type TemplateTextBlock,
  updateManualFieldValue,
} from './builder-types';

/**
 * Contract-only editor grouping — deliberately NOT 1:1 with the document's own paragraph
 * blocks. The legal text stays organized by clause; the editor groups the same fields by
 * what a coordinator is actually filling in (org info, volunteer info, engagement terms).
 */
const ORG_SOURCES: DataSourceKey[] = ['org_name', 'org_address', 'org_city'];
const VOLUNTEER_SOURCES: DataSourceKey[] = [
  'volunteer_first_name',
  'volunteer_last_name',
  'volunteer_address',
  'volunteer_dob',
  'volunteer_iban',
  'volunteer_bic',
];
const ENGAGEMENT_SOURCES: DataSourceKey[] = ['hourly_rate'];
const ENGAGEMENT_MANUAL_FIELD_IDS = [
  'contract-lifespan',
  'tasks',
  'hours-per-week',
];

interface EditorFieldEntry {
  field: TemplateField;
  line: TemplateLine;
  blockId: string;
}

interface ContractEditorGroups {
  org: EditorFieldEntry[];
  volunteer: EditorFieldEntry[];
  engagement: EditorFieldEntry[];
  extraBlock: TemplateTextBlock | undefined;
}

function collectContractEditorGroups(
  doc: TemplateDocument,
): ContractEditorGroups {
  const org: EditorFieldEntry[] = [];
  const volunteer: EditorFieldEntry[] = [];
  const engagement: EditorFieldEntry[] = [];
  const seenSources = new Set<DataSourceKey>();
  const seenManualIds = new Set<string>();
  let extraBlock: TemplateTextBlock | undefined;

  for (const block of doc.blocks) {
    if (block.kind !== 'text') continue;
    if (block.id === 'sonstiges') {
      extraBlock = block;
      continue;
    }
    for (const line of block.lines) {
      for (const field of line.fields) {
        const entry: EditorFieldEntry = { field, line, blockId: block.id };
        if (field.value.kind === 'bound') {
          const source = field.value.source;
          if (seenSources.has(source)) continue;
          if (ORG_SOURCES.includes(source)) {
            seenSources.add(source);
            org.push(entry);
          } else if (VOLUNTEER_SOURCES.includes(source)) {
            seenSources.add(source);
            volunteer.push(entry);
          } else if (ENGAGEMENT_SOURCES.includes(source)) {
            seenSources.add(source);
            engagement.push(entry);
          }
        } else {
          if (seenManualIds.has(field.id)) continue;
          if (ENGAGEMENT_MANUAL_FIELD_IDS.includes(field.id)) {
            seenManualIds.add(field.id);
            engagement.push(entry);
          }
        }
      }
    }
  }

  return { org, volunteer, engagement, extraBlock };
}

const INVOICE_NUMBER_FORMATS: InvoiceNumberFormat[] = [
  'date-number',
  'date-kostenstelle-number',
  'compact-date-number',
  'kostenstelle-month-year-number',
];

function updateLineEnabled(
  lines: TemplateLine[],
  lineId: string,
  enabled: boolean,
): TemplateLine[] {
  return lines.map((l) => (l.id === lineId ? { ...l, enabled } : l));
}

const ROW_TITLE_CLASSNAME = 'text-base font-semibold text-foreground';
const SECTION_TITLE_CLASSNAME = 'text-xl font-semibold text-foreground';

/** A field's display title — same lookup bound/manual fields use everywhere, shared so a parent (e.g. an optional line's header row) can render it once instead of duplicating it inside FieldRow. */
function getFieldTitle(
  field: TemplateField,
  t: ReturnType<typeof useTranslations>,
): string {
  return field.value.kind === 'bound'
    ? t(`dataSources.${field.value.source}` as Parameters<typeof t>[0])
    : t(`manualFieldLabels.${field.id}` as Parameters<typeof t>[0]);
}

interface FieldRowProps {
  field: TemplateField;
  line: TemplateLine;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onManualChange: (fieldId: string, value: string) => void;
  /** Skip rendering the title/badge — a parent (optional-line header row) already rendered it. */
  hideTitle?: boolean;
}

function FieldRow({
  field,
  line,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onManualChange,
  hideTitle = false,
}: FieldRowProps) {
  const t = useTranslations('Accounting.templates.builder');
  const inputId = useId();
  const title = getFieldTitle(field, t);

  if (field.value.kind === 'bound') {
    const isGap = profileGaps.has(field.value.source);
    const known = knownValues[field.value.source];

    const origin = FIELD_ORIGIN[field.value.source];

    const body =
      known && !isGap ? (
        <div className="space-y-0.5">
          <p className="text-sm text-foreground">{known}</p>
          {origin === 'rate_settings' && (
            <p className="text-xs text-muted-foreground">
              {t('fieldSource.rateSettings')}
            </p>
          )}
        </div>
      ) : isGap ? (
        <p className="text-sm text-muted-foreground">
          {t('fieldList.profileWarningBefore')}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {t('fieldList.profileWarningAction')}
          </button>{' '}
          {t('fieldList.profileWarningAfter')}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(
            origin === 'generation_time'
              ? 'fieldSource.generationTime'
              : 'fieldSource.volunteerProfile',
          )}
        </p>
      );

    if (hideTitle) return <div className="space-y-1 py-1">{body}</div>;

    return (
      <div className="space-y-1 py-1">
        <div className="flex items-center gap-2">
          <span className={ROW_TITLE_CLASSNAME}>{title}</span>
          {isGap && (
            <span className="inline-flex items-center gap-1 rounded-full border border-alert/30 bg-alert/15 px-2 py-0.5 text-xs font-medium text-alert">
              <TriangleAlertIcon size={12} aria-hidden="true" />
              {t('fieldList.requiresCollection')}
            </span>
          )}
        </div>
        {body}
      </div>
    );
  }

  const placeholder = t(
    `manualFieldPlaceholders.${field.id}` as Parameters<typeof t>[0],
    { pauschale: typeLabel } as Parameters<typeof t>[1],
  );
  const isDuplicate = firstOccurrenceByFieldId.get(field.id) !== line.id;

  if (isDuplicate) {
    const value = field.value.value.trim();
    return (
      <div className="space-y-1 py-1">
        {!hideTitle && <span className={ROW_TITLE_CLASSNAME}>{title}</span>}
        <p className="text-sm text-muted-foreground">
          {value || (
            <span className="italic">{t('blockEditor.notSetYet')}</span>
          )}
          {' — '}
          {t('blockEditor.sameAsAbove')}
        </p>
      </div>
    );
  }

  const control =
    field.control === 'textarea' ? (
      <Textarea
        id={inputId}
        value={field.value.value}
        onChange={(e) => onManualChange(field.id, e.target.value)}
        placeholder={placeholder}
        aria-label={hideTitle ? title : undefined}
        rows={4}
      />
    ) : field.control === 'month-year' ? (
      <TemplateBuilderMonthYearPicker
        value={field.value.value}
        placeholder={placeholder}
        onChange={(value) => onManualChange(field.id, value)}
      />
    ) : (
      <Input
        id={inputId}
        type={field.control === 'number' ? 'number' : 'text'}
        inputMode={field.control === 'number' ? 'numeric' : undefined}
        value={field.value.value}
        onChange={(e) => onManualChange(field.id, e.target.value)}
        placeholder={placeholder}
        aria-label={hideTitle ? title : undefined}
      />
    );

  if (hideTitle) return <div className="space-y-1 py-1">{control}</div>;

  return (
    <div className="space-y-1 py-1">
      <Label htmlFor={inputId} className="text-base font-semibold">
        {title}
      </Label>
      {control}
    </div>
  );
}

interface LineEditorProps {
  line: TemplateLine;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onToggle: (lineId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
}

function LineEditor({
  line,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onToggle,
  onFieldChange,
}: LineEditorProps) {
  const t = useTranslations('Accounting.templates.builder');

  if (line.optional) {
    const [soleField] = line.fields;
    const title = soleField ? getFieldTitle(soleField, t) : line.id;
    const isGap =
      soleField?.value.kind === 'bound' &&
      profileGaps.has(soleField.value.source);

    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={ROW_TITLE_CLASSNAME}>{title}</span>
            {isGap && (
              <span className="inline-flex items-center gap-1 rounded-full border border-alert/30 bg-alert/15 px-2 py-0.5 text-xs font-medium text-alert">
                <TriangleAlertIcon size={12} aria-hidden="true" />
                {t('fieldList.requiresCollection')}
              </span>
            )}
          </div>
          <Switch
            checked={line.enabled}
            onCheckedChange={(checked) => onToggle(line.id, checked)}
            aria-label={title}
          />
        </div>
        {line.enabled && line.fields.length > 0 && (
          <div className="mt-1.5 space-y-1 border-l-2 border-border/40 pl-3">
            {line.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                line={line}
                firstOccurrenceByFieldId={firstOccurrenceByFieldId}
                profileGaps={profileGaps}
                knownValues={knownValues}
                typeLabel={typeLabel}
                onManualChange={onFieldChange}
                hideTitle
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (line.fields.length === 0) return null;

  return (
    <div className="space-y-1">
      {line.fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          line={line}
          firstOccurrenceByFieldId={firstOccurrenceByFieldId}
          profileGaps={profileGaps}
          knownValues={knownValues}
          typeLabel={typeLabel}
          onManualChange={onFieldChange}
        />
      ))}
    </div>
  );
}

interface BlockEditorRowProps {
  block: TemplateBlock;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onBlockToggle: (blockId: string, enabled: boolean) => void;
  onLineToggle: (blockId: string, lineId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  /** Editor-facing label, when it should differ from the block's own (document-internal) title. */
  titleOverride?: string;
}

function BlockEditorRow({
  block,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onBlockToggle,
  onLineToggle,
  onFieldChange,
  titleOverride,
}: BlockEditorRowProps) {
  const t = useTranslations('Accounting.templates.builder');
  const displayTitle = titleOverride ?? block.title;

  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className={SECTION_TITLE_CLASSNAME}>{displayTitle}</span>
        {block.locked ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <LockIcon
                size={14}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent>{t('blockEditor.lockedHint')}</TooltipContent>
          </Tooltip>
        ) : (
          block.kind === 'text' && (
            <Switch
              checked={block.enabled}
              onCheckedChange={(checked) => onBlockToggle(block.id, checked)}
              aria-label={displayTitle}
            />
          )
        )}
      </div>

      {block.kind === 'table' ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('blockEditor.tableFixedHint')}
        </p>
      ) : (
        (block.locked || block.enabled) && (
          <div className="mt-2 space-y-2">
            {block.lines.map((line) => (
              <LineEditor
                key={line.id}
                line={line}
                firstOccurrenceByFieldId={firstOccurrenceByFieldId}
                profileGaps={profileGaps}
                knownValues={knownValues}
                typeLabel={typeLabel}
                onToggle={(lineId, enabled) =>
                  onLineToggle(block.id, lineId, enabled)
                }
                onFieldChange={onFieldChange}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

interface ContractGroupSectionProps {
  title: string;
  entries: EditorFieldEntry[];
  note?: string;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onLineToggle: (blockId: string, lineId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
}

function ContractGroupSection({
  title,
  entries,
  note,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onLineToggle,
  onFieldChange,
}: ContractGroupSectionProps) {
  if (entries.length === 0) return null;

  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <span className={SECTION_TITLE_CLASSNAME}>{title}</span>
      <div className="mt-2 space-y-2">
        {entries.map(({ field, line, blockId }) =>
          line.optional ? (
            <LineEditor
              key={line.id}
              line={line}
              firstOccurrenceByFieldId={firstOccurrenceByFieldId}
              profileGaps={profileGaps}
              knownValues={knownValues}
              typeLabel={typeLabel}
              onToggle={(lineId, enabled) =>
                onLineToggle(blockId, lineId, enabled)
              }
              onFieldChange={onFieldChange}
            />
          ) : (
            <FieldRow
              key={field.id}
              field={field}
              line={line}
              firstOccurrenceByFieldId={firstOccurrenceByFieldId}
              profileGaps={profileGaps}
              knownValues={knownValues}
              typeLabel={typeLabel}
              onManualChange={onFieldChange}
            />
          ),
        )}
      </div>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

interface TemplateBuilderBlockEditorProps {
  document: TemplateDocument;
  kind: DocumentKind;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onChange: (document: TemplateDocument) => void;
}

export function TemplateBuilderBlockEditor({
  document: templateDoc,
  kind,
  profileGaps,
  knownValues,
  typeLabel,
  onChange,
}: TemplateBuilderBlockEditorProps) {
  const t = useTranslations('Accounting.templates.builder');
  const firstOccurrenceByFieldId = getFirstOccurrenceLineByFieldId(templateDoc);

  function handleHeaderLineToggle(lineId: string, enabled: boolean) {
    onChange({
      ...templateDoc,
      header: {
        ...templateDoc.header,
        metaLines: updateLineEnabled(
          templateDoc.header.metaLines,
          lineId,
          enabled,
        ),
      },
    });
  }

  function handleBlockToggle(blockId: string, enabled: boolean) {
    onChange({
      ...templateDoc,
      blocks: templateDoc.blocks.map((b) =>
        b.id === blockId && b.kind === 'text' ? { ...b, enabled } : b,
      ),
    });
  }

  function handleLineToggle(blockId: string, lineId: string, enabled: boolean) {
    onChange({
      ...templateDoc,
      blocks: templateDoc.blocks.map((b) =>
        b.id === blockId && b.kind === 'text'
          ? { ...b, lines: updateLineEnabled(b.lines, lineId, enabled) }
          : b,
      ),
    });
  }

  function handleFieldChange(fieldId: string, value: string) {
    onChange(updateManualFieldValue(templateDoc, fieldId, value));
  }

  const hasHeaderConfig =
    templateDoc.header.metaLines.length > 0 ||
    templateDoc.invoiceNumberFormat !== undefined;

  if (kind === 'contract') {
    const groups = collectContractEditorGroups(templateDoc);

    return (
      <div className="flex flex-col gap-4">
        <ContractGroupSection
          title={t('editorGroups.org')}
          entries={groups.org}
          note={t('fieldSource.organizationProfile')}
          firstOccurrenceByFieldId={firstOccurrenceByFieldId}
          profileGaps={profileGaps}
          knownValues={knownValues}
          typeLabel={typeLabel}
          onLineToggle={handleLineToggle}
          onFieldChange={handleFieldChange}
        />
        <ContractGroupSection
          title={t('editorGroups.volunteer')}
          entries={groups.volunteer}
          firstOccurrenceByFieldId={firstOccurrenceByFieldId}
          profileGaps={profileGaps}
          knownValues={knownValues}
          typeLabel={typeLabel}
          onLineToggle={handleLineToggle}
          onFieldChange={handleFieldChange}
        />
        <ContractGroupSection
          title={t('editorGroups.engagement')}
          entries={groups.engagement}
          firstOccurrenceByFieldId={firstOccurrenceByFieldId}
          profileGaps={profileGaps}
          knownValues={knownValues}
          typeLabel={typeLabel}
          onLineToggle={handleLineToggle}
          onFieldChange={handleFieldChange}
        />
        {groups.extraBlock && (
          <BlockEditorRow
            block={groups.extraBlock}
            titleOverride={t('editorGroups.extra')}
            firstOccurrenceByFieldId={firstOccurrenceByFieldId}
            profileGaps={profileGaps}
            knownValues={knownValues}
            typeLabel={typeLabel}
            onBlockToggle={handleBlockToggle}
            onLineToggle={handleLineToggle}
            onFieldChange={handleFieldChange}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasHeaderConfig && (
        <div className="border-b border-border pb-4">
          <span className={SECTION_TITLE_CLASSNAME}>
            {t('blockEditor.headerTitle')}
          </span>
          <div className="mt-2 space-y-2">
            {templateDoc.invoiceNumberFormat !== undefined && (
              <div className="space-y-1">
                <Label className="text-base font-semibold">
                  {t('blockEditor.invoiceNumberFormatLabel')}
                </Label>
                <Select
                  value={templateDoc.invoiceNumberFormat}
                  onValueChange={(value) =>
                    onChange({
                      ...templateDoc,
                      invoiceNumberFormat: value as InvoiceNumberFormat,
                    })
                  }
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_NUMBER_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {t(
                          `invoiceNumberFormats.${format}` as Parameters<
                            typeof t
                          >[0],
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {templateDoc.header.metaLines.map((line) => (
              <LineEditor
                key={line.id}
                line={line}
                firstOccurrenceByFieldId={firstOccurrenceByFieldId}
                profileGaps={profileGaps}
                knownValues={knownValues}
                typeLabel={typeLabel}
                onToggle={handleHeaderLineToggle}
                onFieldChange={handleFieldChange}
              />
            ))}
          </div>
        </div>
      )}

      {templateDoc.blocks.map((block) => (
        <BlockEditorRow
          key={block.id}
          block={block}
          firstOccurrenceByFieldId={firstOccurrenceByFieldId}
          profileGaps={profileGaps}
          knownValues={knownValues}
          typeLabel={typeLabel}
          onBlockToggle={handleBlockToggle}
          onLineToggle={handleLineToggle}
          onFieldChange={handleFieldChange}
        />
      ))}
    </div>
  );
}
