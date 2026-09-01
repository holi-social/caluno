'use client';

import {
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { LockIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useId } from 'react';
import type { DocumentKind } from '../doc-type-header';
import { InfoPanel } from '../info-panel';
import { TemplateBuilderPeriodPicker } from './builder-period-picker';
import {
  type DataSourceKey,
  FIELD_ORIGIN,
  getFirstOccurrenceLineByFieldId,
  type InvoiceNumberFormat,
  type TableFirstColumnSource,
  type TemplateBlock,
  type TemplateDocument,
  type TemplateField,
  type TemplateLine,
  type TemplateTableBlock,
  type TemplateTextBlock,
  updateManualFieldValue,
} from './builder-types';

/**
 * Contract-only editor grouping — deliberately NOT 1:1 with the document's own paragraph
 * blocks. The legal text stays organized by clause; the editor groups the same fields by
 * what a coordinator is actually filling in (org info, volunteer info, engagement terms).
 */
const ORG_SOURCES: DataSourceKey[] = [
  'org_name',
  'org_address',
  'org_city',
  'org_legal_rep',
];
const VOLUNTEER_SOURCES: DataSourceKey[] = [
  'volunteer_first_name',
  'volunteer_last_name',
  'volunteer_address',
  'volunteer_dob',
  'volunteer_iban',
  'volunteer_bic',
];
const ENGAGEMENT_SOURCES: DataSourceKey[] = ['hourly_rate'];
const ENGAGEMENT_MANUAL_FIELD_IDS = ['contract-lifespan', 'tasks'];

interface EditorFieldEntry {
  field: TemplateField;
  line: TemplateLine;
  blockId: string;
}

/** The hours-per-{unit} line's two manual fields, rendered together in one card by `HoursFieldCard` instead of as two separate generic field rows. */
export interface HoursEditorEntry {
  line: TemplateLine;
  unitField: TemplateField;
  amountField: TemplateField;
}

export interface ContractEditorGroups {
  org: EditorFieldEntry[];
  volunteer: EditorFieldEntry[];
  engagement: EditorFieldEntry[];
  hours: HoursEditorEntry | undefined;
  extraBlock: TemplateTextBlock | undefined;
}

export function collectContractEditorGroups(
  doc: TemplateDocument,
): ContractEditorGroups {
  const org: EditorFieldEntry[] = [];
  const volunteer: EditorFieldEntry[] = [];
  const engagement: EditorFieldEntry[] = [];
  const seenSources = new Set<DataSourceKey>();
  const seenManualIds = new Set<string>();
  let extraBlock: TemplateTextBlock | undefined;
  let hours: HoursEditorEntry | undefined;
  let hoursUnitField: TemplateField | undefined;

  for (const block of doc.blocks) {
    if (block.kind !== 'text') continue;
    if (block.id === 'sonstiges') {
      extraBlock = block;
      continue;
    }
    for (const line of block.lines) {
      for (const field of line.fields) {
        if (field.id === 'hours-unit') {
          hoursUnitField = field;
          continue;
        }
        if (field.id === 'hours-amount') {
          if (hoursUnitField) {
            hours = { line, unitField: hoursUnitField, amountField: field };
          }
          continue;
        }
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

  return { org, volunteer, engagement, hours, extraBlock };
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

const SECTION_TITLE_CLASSNAME = 'text-lg font-semibold text-foreground';

/**
 * Realistic-looking example content for a bound source with no value yet — reads like what
 * will actually be there, not the field's own label. Same "always German" convention as the
 * document's own literal text (see builder-document-presets.ts).
 */
const PLACEHOLDER_EXAMPLES: Partial<Record<DataSourceKey, string>> = {
  volunteer_first_name: 'Vorname',
  volunteer_last_name: 'Name',
  volunteer_address: 'Musterstraße 1, 12345 Stadt',
  volunteer_dob: 'TT.MM.JJJJ',
  volunteer_iban: 'DE00 0000 0000 0000 0000 00',
  volunteer_bic: 'XXXXXXXX',
  volunteer_tax_id: 'XX XXX XXX XXX',
  period_start: 'TT.MM.JJJJ',
  period_end: 'TT.MM.JJJJ',
  total_hours: '0',
  total_amount: '0,00 €',
  generated_date: 'TT.MM.JJJJ',
  document_number: 'XXXX-XXX',
};

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

/** Amber "profile data was never collected" badge — shared by a bound field's own card and its parent optional-line card. */
function ProfileGapBadge({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-alert/30 bg-alert/15 px-2 py-0.5 text-xs font-medium text-alert">
      <TriangleAlertIcon size={12} aria-hidden="true" />
      {t('fieldList.requiresCollection')}
    </span>
  );
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
    const hasValue = !!known && !isGap;
    const placeholderExample =
      PLACEHOLDER_EXAMPLES[field.value.source] ?? title;

    const body = hasValue ? (
      <div className="space-y-0.5">
        <p className="text-base text-foreground">{known}</p>
        {(origin === 'rate_settings' || origin === 'organization_profile') && (
          <p className="text-xs text-muted-foreground">
            {t(
              origin === 'rate_settings'
                ? 'fieldSource.rateSettings'
                : 'fieldSource.organizationProfile',
            )}
          </p>
        )}
      </div>
    ) : isGap ? (
      <div className="space-y-0.5">
        <p className="text-base italic text-muted-foreground">
          {placeholderExample}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('fieldList.profileWarningBefore')}{' '}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            {t('fieldList.profileWarningAction')}
          </button>{' '}
          {t('fieldList.profileWarningAfter')}
        </p>
      </div>
    ) : (
      <div className="space-y-0.5">
        <p className="text-base italic text-muted-foreground">
          {placeholderExample}
        </p>
        <p className="text-xs text-muted-foreground">
          {t(
            origin === 'generation_time'
              ? 'fieldSource.generationTime'
              : 'fieldSource.volunteerProfile',
          )}
        </p>
      </div>
    );

    if (hideTitle) return <div className="py-1">{body}</div>;

    return (
      <InfoPanel variant="outline" title={title}>
        {body}
      </InfoPanel>
    );
  }

  const placeholder = t(
    `manualFieldPlaceholders.${field.id}` as Parameters<typeof t>[0],
    { pauschale: typeLabel } as Parameters<typeof t>[1],
  );
  const isDuplicate = firstOccurrenceByFieldId.get(field.id) !== line.id;

  if (isDuplicate) {
    const value = field.value.value.trim();
    const body = (
      <p className="text-sm text-muted-foreground">
        {value || <span className="italic">{t('blockEditor.notSetYet')}</span>}
        {' — '}
        {t('blockEditor.sameAsAbove')}
      </p>
    );
    if (hideTitle) return <div className="py-1">{body}</div>;
    return (
      <InfoPanel variant="outline" title={title}>
        {body}
      </InfoPanel>
    );
  }

  const control =
    field.control === 'textarea' ? (
      <Textarea
        id={inputId}
        value={field.value.value}
        onChange={(e) => onManualChange(field.id, e.target.value)}
        placeholder={placeholder}
        aria-label={title}
        rows={4}
      />
    ) : field.control === 'period' ? (
      <TemplateBuilderPeriodPicker
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
        aria-label={title}
      />
    );

  if (hideTitle) return <div className="py-1">{control}</div>;

  return (
    <InfoPanel variant="outline" title={title}>
      {control}
    </InfoPanel>
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
      <InfoPanel
        variant="outline"
        title={title}
        inactive={!line.enabled}
        badge={isGap && <ProfileGapBadge t={t} />}
        headerRight={
          <Switch
            checked={line.enabled}
            onCheckedChange={(checked) => onToggle(line.id, checked)}
            aria-label={title}
          />
        }
      >
        {line.enabled && line.fields.length > 0 && (
          <div className="flex flex-col gap-3">
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
      </InfoPanel>
    );
  }

  if (line.fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
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

const TABLE_FIRST_COLUMN_SOURCES: TableFirstColumnSource[] = [
  'agreement_task_description',
  'custom',
];

/** The Stundennachweis table's one configurable choice — everything else about its shape is fixed. */
function TableFirstColumnSourceCard({
  block,
  onSourceChange,
  onCustomLabelChange,
}: {
  block: TemplateTableBlock;
  onSourceChange: (source: TableFirstColumnSource) => void;
  onCustomLabelChange: (value: string) => void;
}) {
  const t = useTranslations('Accounting.templates.builder');
  const idBase = useId();

  return (
    <InfoPanel
      variant="outline"
      title={t('blockEditor.firstColumnSourceLabel')}
    >
      <RadioGroup
        value={block.firstColumnSource}
        onValueChange={(value) =>
          onSourceChange(value as TableFirstColumnSource)
        }
        className="gap-3"
      >
        {TABLE_FIRST_COLUMN_SOURCES.map((source) => (
          <div key={source} className="flex items-start gap-2">
            <RadioGroupItem
              value={source}
              id={`${idBase}-${source}`}
              className="mt-0.5"
            />
            <Label htmlFor={`${idBase}-${source}`} className="font-normal">
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="text-base font-medium text-foreground">
                  {t(
                    `blockEditor.firstColumnSourceOptions.${source}.label` as Parameters<
                      typeof t
                    >[0],
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t(
                    `blockEditor.firstColumnSourceOptions.${source}.hint` as Parameters<
                      typeof t
                    >[0],
                  )}
                </span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      {block.firstColumnSource === 'custom' && (
        <Input
          className="mt-3"
          value={block.firstColumnCustomLabel}
          onChange={(e) => onCustomLabelChange(e.target.value)}
          placeholder={t('blockEditor.firstColumnPlaceholders.custom')}
          aria-label={t('blockEditor.firstColumnSourceOptions.custom.label')}
        />
      )}
    </InfoPanel>
  );
}

interface BlockEditorRowProps {
  block: TemplateBlock;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onLineToggle: (blockId: string, lineId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  onTableFirstColumnSourceChange: (
    blockId: string,
    source: TableFirstColumnSource,
  ) => void;
  onTableFirstColumnCustomLabelChange: (blockId: string, value: string) => void;
}

/**
 * A section headline (never a card itself) followed by one card per line — every block
 * reaching this component is locked/mandatory (the one switchable block, "Sonstiges", is
 * rendered by `ExtraClausesCard` instead, with its switch on the field card, not the headline).
 */
function BlockEditorRow({
  block,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onLineToggle,
  onFieldChange,
  onTableFirstColumnSourceChange,
  onTableFirstColumnCustomLabelChange,
}: BlockEditorRowProps) {
  const t = useTranslations('Accounting.templates.builder');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={SECTION_TITLE_CLASSNAME}>{block.title}</span>
        {block.locked && (
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
        )}
      </div>

      {block.kind === 'table' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t('blockEditor.tableFixedHint')}
          </p>
          <TableFirstColumnSourceCard
            block={block}
            onSourceChange={(source) =>
              onTableFirstColumnSourceChange(block.id, source)
            }
            onCustomLabelChange={(value) =>
              onTableFirstColumnCustomLabelChange(block.id, value)
            }
          />
        </div>
      ) : block.kind === 'note' ? (
        <p className="text-sm text-muted-foreground">
          {t('blockEditor.alreadyReceivedHint')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
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
      )}
    </div>
  );
}

/**
 * The contract's one switchable block ("Sonstiges" / Extra clauses) has exactly one line, one
 * field (the freeform textarea) — so instead of a headline that's secretly a card with the
 * on/off switch (the bug this replaces), the headline stays plain text and the single field
 * card itself carries the switch, matching every other optional-content card in this editor.
 */
function ExtraClausesCard({
  block,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onBlockToggle,
  onFieldChange,
}: {
  block: TemplateTextBlock;
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onBlockToggle: (blockId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
}) {
  const t = useTranslations('Accounting.templates.builder');
  const [line] = block.lines;
  const [field] = line?.fields ?? [];
  if (!line || !field) return null;
  const title = getFieldTitle(field, t);

  return (
    <div className="flex flex-col gap-3">
      <span className={SECTION_TITLE_CLASSNAME}>{t('editorGroups.extra')}</span>
      <InfoPanel
        variant="outline"
        title={title}
        inactive={!block.enabled}
        headerRight={
          <Switch
            checked={block.enabled}
            onCheckedChange={(checked) => onBlockToggle(block.id, checked)}
            aria-label={title}
          />
        }
      >
        {block.enabled && (
          <FieldRow
            field={field}
            line={line}
            firstOccurrenceByFieldId={firstOccurrenceByFieldId}
            profileGaps={profileGaps}
            knownValues={knownValues}
            typeLabel={typeLabel}
            onManualChange={onFieldChange}
            hideTitle
          />
        )}
      </InfoPanel>
    </div>
  );
}

/**
 * The contract's hours-per-{unit} line has two manual fields (unit, amount) that belong in
 * one card, not two — the unit is a Tabs choice above the number input, never a separate
 * field row of its own.
 */
function HoursFieldCard({
  unitField,
  amountField,
  onFieldChange,
}: {
  unitField: TemplateField;
  amountField: TemplateField;
  onFieldChange: (fieldId: string, value: string) => void;
}) {
  const t = useTranslations('Accounting.templates.builder');
  const unitValue =
    unitField.value.kind === 'manual-template'
      ? unitField.value.value
      : 'Monat';
  const amountValue =
    amountField.value.kind === 'manual-template' ? amountField.value.value : '';
  const title = t('manualFieldLabels.hours-amount');
  const amountPlaceholder = t(
    unitValue === 'Woche'
      ? 'manualFieldPlaceholders.hours-amount-week'
      : 'manualFieldPlaceholders.hours-amount-month',
  );

  return (
    <InfoPanel variant="outline" title={title}>
      <div className="flex flex-col gap-2">
        <Tabs
          value={unitValue}
          onValueChange={(v) => onFieldChange(unitField.id, v)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="Monat" className="flex-1">
              {t('hoursUnit.month')}
            </TabsTrigger>
            <TabsTrigger value="Woche" className="flex-1">
              {t('hoursUnit.week')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          type="number"
          inputMode="numeric"
          value={amountValue}
          onChange={(e) => onFieldChange(amountField.id, e.target.value)}
          placeholder={amountPlaceholder}
          aria-label={title}
        />
      </div>
    </InfoPanel>
  );
}

interface ContractGroupSectionProps {
  title: string;
  entries: EditorFieldEntry[];
  firstOccurrenceByFieldId: Map<string, string>;
  profileGaps: Set<DataSourceKey>;
  knownValues: Partial<Record<DataSourceKey, string>>;
  typeLabel: string;
  onLineToggle: (blockId: string, lineId: string, enabled: boolean) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  /** Trailing card that doesn't fit the generic field/line entry shape (e.g. the paired hours-unit/hours-amount card). */
  extra?: ReactNode;
}

function ContractGroupSection({
  title,
  entries,
  firstOccurrenceByFieldId,
  profileGaps,
  knownValues,
  typeLabel,
  onLineToggle,
  onFieldChange,
  extra,
}: ContractGroupSectionProps) {
  if (entries.length === 0 && !extra) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className={SECTION_TITLE_CLASSNAME}>{title}</span>
      <div className="flex flex-col gap-3">
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
        {extra}
      </div>
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

  function handleTableFirstColumnSourceChange(
    blockId: string,
    source: TableFirstColumnSource,
  ) {
    onChange({
      ...templateDoc,
      blocks: templateDoc.blocks.map((b) =>
        b.id === blockId && b.kind === 'table'
          ? { ...b, firstColumnSource: source }
          : b,
      ),
    });
  }

  function handleTableFirstColumnCustomLabelChange(
    blockId: string,
    value: string,
  ) {
    onChange({
      ...templateDoc,
      blocks: templateDoc.blocks.map((b) =>
        b.id === blockId && b.kind === 'table'
          ? { ...b, firstColumnCustomLabel: value }
          : b,
      ),
    });
  }

  const hasHeaderConfig =
    templateDoc.header.metaLines.length > 0 ||
    templateDoc.invoiceNumberFormat !== undefined;

  if (kind === 'contract') {
    const groups = collectContractEditorGroups(templateDoc);

    return (
      <div className="flex flex-col gap-6">
        <ContractGroupSection
          title={t('editorGroups.org')}
          entries={groups.org}
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
          extra={
            groups.hours && (
              <HoursFieldCard
                unitField={groups.hours.unitField}
                amountField={groups.hours.amountField}
                onFieldChange={handleFieldChange}
              />
            )
          }
        />
        {groups.extraBlock && (
          <ExtraClausesCard
            block={groups.extraBlock}
            firstOccurrenceByFieldId={firstOccurrenceByFieldId}
            profileGaps={profileGaps}
            knownValues={knownValues}
            typeLabel={typeLabel}
            onBlockToggle={handleBlockToggle}
            onFieldChange={handleFieldChange}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {hasHeaderConfig && (
        <div className="flex flex-col gap-3">
          <span className={SECTION_TITLE_CLASSNAME}>
            {t('blockEditor.headerTitle')}
          </span>
          <div className="flex flex-col gap-3">
            {templateDoc.invoiceNumberFormat !== undefined && (
              <InfoPanel
                variant="outline"
                title={t('blockEditor.invoiceNumberFormatLabel')}
              >
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
              </InfoPanel>
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
          onLineToggle={handleLineToggle}
          onFieldChange={handleFieldChange}
          onTableFirstColumnSourceChange={handleTableFirstColumnSourceChange}
          onTableFirstColumnCustomLabelChange={
            handleTableFirstColumnCustomLabelChange
          }
        />
      ))}
    </div>
  );
}
