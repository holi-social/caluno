import { getEffectivePauschaleRate } from '../../mock-rates';
import type { PauschalenType } from '../doc-type-header';
import type {
  DataSourceKey,
  TemplateDocument,
  TemplateField,
  TemplateLine,
} from './builder-types';

function bound(id: string, source: DataSourceKey): TemplateField {
  return { id, value: { kind: 'bound', source } };
}

function manual(
  id: string,
  value = '',
  control?: TemplateField['control'],
): TemplateField {
  return { id, value: { kind: 'manual-template', value }, control };
}

/** German decimal-comma formatting for a rate, e.g. 4.5 -> "4,50". */
export function formatRateComma(rate: number): string {
  return rate.toFixed(2).replace('.', ',');
}

// Effective hourly rate as configured on the Rates tab — reads the same
// single source of truth as rates-section-card.tsx (mock-rates.ts) so the
// two surfaces can never drift into disagreeing placeholder numbers.
function knownHourlyRate(pauschale: PauschalenType): string {
  return formatRateComma(getEffectivePauschaleRate(pauschale));
}

const KNOWN_PAUSCHALE_LABEL: Record<PauschalenType, string> = {
  ehrenamt: 'Ehrenamtspauschale',
  uebungleiter: 'Übungsleiterpauschale',
};

const KNOWN_ORG = {
  org_name: 'Rotes Kreuz Berlin e.V.',
  org_address: 'Musterstraße 12, 10115 Berlin',
  org_city: 'Berlin',
  org_legal_rep: 'Dr. Erika Musterfrau',
};

/**
 * Data sources already known at template-configuration time (the org itself, its
 * configured rate) — shown as real values in the preview instead of a generic
 * "will be filled in later" chip. Volunteer- and generation-time sources (name, IBAN,
 * dates, totals) aren't in this map — there's no specific volunteer yet.
 */
export function getKnownOrgValues(
  pauschale: PauschalenType,
): Partial<Record<DataSourceKey, string>> {
  return {
    ...KNOWN_ORG,
    hourly_rate: knownHourlyRate(pauschale),
    pauschalen_type: KNOWN_PAUSCHALE_LABEL[pauschale],
  };
}

function line(
  id: string,
  text: string,
  fields: TemplateField[] = [],
  options: { optional?: boolean; enabled?: boolean } = {},
): TemplateLine {
  return {
    id,
    text,
    fields,
    optional: options.optional ?? false,
    // Optional lines are opt-in — default off unless the caller says otherwise.
    enabled: options.enabled ?? !options.optional,
  };
}

const PAUSCHALE_TITLE: Record<PauschalenType, string> = {
  ehrenamt: 'Aufwandsentschädigung gemäß § 3 Nr. 26a EStG (Ehrenamtspauschale)',
  uebungleiter:
    'Aufwandsentschädigung gemäß § 3 Nr. 26 EStG (Übungsleiterpauschale)',
};

const PAUSCHALE_INVOICE_TITLE: Record<PauschalenType, string> = {
  ehrenamt: 'Stundennachweis Ehrenamtspauschale',
  uebungleiter: 'Stundennachweis Übungsleiterpauschale',
};

export function getContractDocument(
  pauschale: PauschalenType,
): TemplateDocument {
  // Shared across both blocks so one coordinator-typed value drives both mentions.
  const contractLifespan = manual('contract-lifespan', '', 'period');

  return {
    header: {
      titleLines: ['Zusatzvereinbarung zur', PAUSCHALE_TITLE[pauschale]],
      orgIdentityLine: line('header-org-identity', '{orgName} {orgAddress}', [
        bound('header-org-name', 'org_name'),
        bound('header-org-address', 'org_address'),
      ]),
      metaLines: [],
    },
    blocks: [
      {
        kind: 'text',
        id: 'persoenliche-daten',
        title: 'Persönliche Daten',
        locked: true,
        enabled: true,
        lines: [
          line('parties', 'Zwischen dem {orgName} {orgAddress}, und', [
            bound('parties-org-name', 'org_name'),
            bound('parties-org-address', 'org_address'),
          ]),
          line(
            'volunteer-name',
            '{volunteerFirstName} {volunteerLastName} (Vorname Nachname),',
            [
              bound('volunteer-name-first', 'volunteer_first_name'),
              bound('volunteer-name-last', 'volunteer_last_name'),
            ],
          ),
          line(
            'volunteer-address',
            'wohnhaft in {volunteerAddress},',
            [bound('volunteer-address-field', 'volunteer_address')],
            { optional: true },
          ),
          line(
            'volunteer-dob',
            'geboren am {volunteerDob}',
            [bound('volunteer-dob-field', 'volunteer_dob')],
            { optional: true },
          ),
          line(
            'parties-closing',
            'im Folgenden „ehrenamtlich tätige Person" genannt, wird Folgendes vereinbart:',
          ),
        ],
      },
      {
        kind: 'text',
        id: 'zeitraum-taetigkeit',
        title: 'Zeitraum und ehrenamtliche Tätigkeit',
        locked: true,
        enabled: true,
        lines: [
          line(
            'engagement-scope',
            'Die ehrenamtlich tätige Person übt im Zeitraum {contractLifespan} für die Einrichtung {orgName} eine nebenberufliche Tätigkeit aus.',
            [contractLifespan, bound('engagement-org-name', 'org_name')],
          ),
          line(
            'engagement-tasks',
            'Im Rahmen des steuerbegünstigten Zwecks einer gemeinnützigen Organisation ist die Person mit folgenden Tätigkeiten ehrenamtlich tätig: {tasks}',
            [manual('tasks')],
          ),
        ],
      },
      {
        kind: 'text',
        id: 'freiwillige-stunden',
        title: 'Freiwillige Stunden',
        locked: true,
        enabled: true,
        lines: [
          line(
            'hours-scope',
            'Zeitraum: {contractLifespan}  Stundenzahl pro {hoursUnit}: ca. {hoursAmount}',
            [
              contractLifespan,
              manual('hours-unit', 'Monat', 'unit-tabs'),
              manual('hours-amount', '', 'number'),
            ],
          ),
          line(
            'hours-confirmation',
            'Die ehrenamtlich tätige Person bestätigt, dass der zeitliche Umfang der Tätigkeit (ggf. unter Berücksichtigung weiterer gleichartiger Tätigkeiten), bezogen auf das Kalenderjahr, höchstens ein Drittel der Arbeitszeit bei Vollbeschäftigung beträgt.',
          ),
        ],
      },
      {
        kind: 'text',
        id: 'aufwandsentschaedigung',
        title: 'Aufwandsentschädigung',
        locked: true,
        enabled: true,
        lines: [
          line(
            'rate',
            'Als Aufwandsentschädigung erhält die ehrenamtlich tätige Person {rate} € pro Stunde.',
            [bound('rate-field', 'hourly_rate')],
          ),
          line(
            'payout-intro',
            'Die Aufwandsentschädigung wird monatlich auf folgendes Konto überwiesen:',
          ),
          line(
            'payout-holder',
            '{volunteerFirstName} {volunteerLastName}, (Kontoinhaber:in)',
            [
              bound('payout-holder-first', 'volunteer_first_name'),
              bound('payout-holder-last', 'volunteer_last_name'),
            ],
          ),
          line('payout-iban', '{volunteerIban} (IBAN)', [
            bound('payout-iban-field', 'volunteer_iban'),
          ]),
          line('payout-bic', '{volunteerBic} (BIC)', [
            bound('payout-bic-field', 'volunteer_bic'),
          ]),
        ],
      },
      {
        kind: 'text',
        id: 'sonstiges',
        title: 'Sonstiges',
        locked: false,
        // Opt-in, off by default — its own field is optional additive content
        // ("add other clauses if you need to"), so it shouldn't demand a value
        // out of the box just because it's rendered.
        enabled: false,
        lines: [
          line('freeform', '{freeformText}', [
            manual('freeform-text', '', 'textarea'),
          ]),
        ],
      },
    ],
    footer: {
      closingLine: line('closing', '{place}, {date}', [
        bound('closing-place', 'org_city'),
        bound('closing-date', 'generated_date'),
      ]),
      showSignatures: true,
    },
  };
}

export function getInvoiceDocument(
  pauschale: PauschalenType,
): TemplateDocument {
  return {
    header: {
      titleLines: [PAUSCHALE_INVOICE_TITLE[pauschale]],
      orgIdentityLine: line('header-org-identity', '{orgAddress}', [
        bound('header-org-address', 'org_address'),
      ]),
      metaLines: [
        line('meta-invoice-number', '{documentNumber}', [
          bound('meta-invoice-number-field', 'document_number'),
        ]),
        line('meta-date', '{date}', [
          bound('meta-date-field', 'generated_date'),
        ]),
        line(
          'meta-kostenstelle',
          'Kostenstelle: {kostenstelle}',
          [manual('kostenstelle')],
          {
            optional: true,
          },
        ),
        line(
          'meta-kostentraeger',
          'Kostenträger: {kostentraeger}',
          [manual('kostentraeger')],
          {
            optional: true,
          },
        ),
      ],
    },
    blocks: [
      {
        kind: 'text',
        id: 'persoenliche-daten',
        title: 'Persönliche Daten',
        locked: true,
        enabled: true,
        lines: [
          line('volunteer-name', '{volunteerFirstName} {volunteerLastName}', [
            bound('volunteer-name-first', 'volunteer_first_name'),
            bound('volunteer-name-last', 'volunteer_last_name'),
          ]),
          line('volunteer-address', '{volunteerAddress}', [
            bound('volunteer-address-field', 'volunteer_address'),
          ]),
          line('volunteer-iban', '{volunteerIban}', [
            bound('volunteer-iban-field', 'volunteer_iban'),
          ]),
        ],
      },
      {
        kind: 'table',
        id: 'stundennachweis',
        title: 'Stundennachweis',
        locked: true,
        columns: [
          'Tätigkeit',
          'Beginn',
          'Ende',
          'Stunden gesamt',
          'Stundensatz',
        ],
        previewRowCount: 10,
        firstColumnSource: 'shift_name',
      },
    ],
    footer: {
      closingLine: line('closing', '{place}, {date}', [
        bound('closing-place', 'org_city'),
        bound('closing-date', 'generated_date'),
      ]),
      showSignatures: true,
    },
    invoiceNumberFormat: 'date-number',
  };
}
