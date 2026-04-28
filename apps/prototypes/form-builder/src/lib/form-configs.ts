import type { FormConfig } from './types';

export const PRESET_FORM_CONFIGS: FormConfig[] = [
  {
    id: 'cfg-hanseatic-help',
    slug: 'hanseatic-help',
    name: 'Schnellregistrierung',
    description: 'Einfaches Formular fuer die schnelle Vor-Ort-Registrierung von Freiwilligen.',
    organizationName: 'Hanseatic Help',
    locale: 'de',
    sections: [
      {
        id: 'sec-hh-registration',
        title: 'Registrierung',
        description: 'Bitte geben Sie Ihre Kontaktdaten ein.',
        icon: 'User',
        fields: [
          {
            id: 'hh-name',
            type: 'text',
            label: 'Name',
            placeholder: 'z.B. Max Mustermann',
            required: true,
          },
          {
            id: 'hh-email',
            type: 'email',
            label: 'E-Mail',
            placeholder: 'z.B. max@beispiel.de',
            required: true,
          },
        ],
      },
    ],
    settings: {
      submitButtonLabel: 'Registrieren',
      successTitle: 'Vielen Dank!',
      successMessage:
        'Ihre Registrierung war erfolgreich. Wir freuen uns auf Ihre Mitarbeit!',
      allowEmbed: true,
    },
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'cfg-bsm',
    slug: 'berliner-stadtmission',
    name: 'Onboarding Ehrenamt',
    description:
      'Onboarding-Formular mit persoenlichen Daten und erforderlichen Dokumentenbestaetigungen.',
    organizationName: 'Berliner Stadtmission',
    locale: 'de',
    sections: [
      {
        id: 'sec-bsm-personal',
        title: 'Persoenliche Daten',
        description:
          'Erstellen Sie ein Konto, um sich als Freiwillige/r bei der Berliner Stadtmission anzumelden.',
        icon: 'User',
        locked: true,
        lockedSource: 'BSM Abteilung Ehrenamt',
        fields: [
          {
            id: 'bsm-firstname',
            type: 'text',
            label: 'Vorname',
            placeholder: 'z.B. Max',
            required: true,
          },
          {
            id: 'bsm-lastname',
            type: 'text',
            label: 'Nachname',
            placeholder: 'z.B. Mustermann',
            required: true,
          },
          {
            id: 'bsm-email',
            type: 'email',
            label: 'E-Mail',
            placeholder: 'z.B. max@beispiel.de',
            required: true,
          },
          {
            id: 'bsm-phone',
            type: 'phone',
            label: 'Telefon',
            placeholder: 'z.B. +49 170 1234567',
            required: false,
          },
          {
            id: 'bsm-dob',
            type: 'date',
            label: 'Geburtsdatum',
            required: true,
            minAge: 14,
          },
        ],
      },
      {
        id: 'sec-bsm-address',
        title: 'Adresse',
        description: 'Ihre aktuelle Wohnanschrift.',
        icon: 'MapPin',
        fields: [
          {
            id: 'bsm-street',
            type: 'text',
            label: 'Strasse und Hausnummer',
            placeholder: 'z.B. Musterstrasse 42',
            required: true,
          },
          {
            id: 'bsm-plz',
            type: 'plz',
            label: 'PLZ',
            placeholder: 'z.B. 10115',
            required: true,
          },
          {
            id: 'bsm-city',
            type: 'text',
            label: 'Stadt',
            placeholder: 'z.B. Berlin',
            required: true,
          },
        ],
      },
      {
        id: 'sec-bsm-documents',
        title: 'Dokumente & Einverstaendnisse',
        description:
          'Bitte bestaetige die folgenden Dokumente, um das Onboarding abzuschliessen.',
        icon: 'FileCheck',
        fields: [
          {
            id: 'bsm-privacy',
            type: 'document-acknowledgement',
            label: 'Datenschutzerklaerung',
            documentUrl: '/datenschutz',
            documentLabel: 'Datenschutzerklaerung lesen',
            required: true,
          },
          {
            id: 'bsm-volunteer-agreement',
            type: 'document-acknowledgement',
            label: 'Freiwilligenvereinbarung',
            documentUrl: '/freiwilligenvereinbarung',
            documentLabel: 'Freiwilligenvereinbarung lesen',
            required: true,
          },
          {
            id: 'bsm-newsletter',
            type: 'checkbox',
            label: 'Ich moechte den Newsletter erhalten',
            description:
              'Wir informieren Sie regelmaessig ueber Neuigkeiten und Veranstaltungen.',
            required: false,
          },
        ],
      },
    ],
    settings: {
      submitButtonLabel: 'Onboarding abschliessen',
      successTitle: 'Willkommen im Team!',
      successMessage:
        'Ihr Onboarding wurde erfolgreich abgeschlossen. Wir melden uns in Kuerze bei Ihnen.',
      allowEmbed: true,
    },
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'cfg-bsm-compensation',
    slug: 'berliner-stadtmission-verguetung',
    name: 'Onboarding mit Verguetung',
    description:
      'Onboarding-Formular mit zusaetzlichen verguetungsbezogenen Feldern.',
    organizationName: 'Berliner Stadtmission',
    locale: 'de',
    sections: [
      {
        id: 'sec-bsmv-personal',
        title: 'Persoenliche Daten',
        description:
          'Erstellen Sie ein Konto, um sich als Freiwillige/r bei der Berliner Stadtmission anzumelden.',
        icon: 'User',
        locked: true,
        lockedSource: 'BSM Abteilung Ehrenamt',
        fields: [
          {
            id: 'bsmv-firstname',
            type: 'text',
            label: 'Vorname',
            placeholder: 'z.B. Max',
            required: true,
          },
          {
            id: 'bsmv-lastname',
            type: 'text',
            label: 'Nachname',
            placeholder: 'z.B. Mustermann',
            required: true,
          },
          {
            id: 'bsmv-email',
            type: 'email',
            label: 'E-Mail',
            placeholder: 'z.B. max@beispiel.de',
            required: true,
          },
          {
            id: 'bsmv-phone',
            type: 'phone',
            label: 'Telefon',
            placeholder: 'z.B. +49 170 1234567',
            required: false,
          },
          {
            id: 'bsmv-dob',
            type: 'date',
            label: 'Geburtsdatum',
            required: true,
            minAge: 14,
          },
        ],
      },
      {
        id: 'sec-bsmv-address',
        title: 'Adresse',
        description: 'Ihre aktuelle Wohnanschrift.',
        icon: 'MapPin',
        fields: [
          {
            id: 'bsmv-street',
            type: 'text',
            label: 'Strasse und Hausnummer',
            placeholder: 'z.B. Musterstrasse 42',
            required: true,
          },
          {
            id: 'bsmv-plz',
            type: 'plz',
            label: 'PLZ',
            placeholder: 'z.B. 10115',
            required: true,
          },
          {
            id: 'bsmv-city',
            type: 'text',
            label: 'Stadt',
            placeholder: 'z.B. Berlin',
            required: true,
          },
        ],
      },
      {
        id: 'sec-bsmv-compensation',
        title: 'Verguetungsinformationen',
        description: 'Angaben fuer die Aufwandsentschaedigung.',
        icon: 'Banknote',
        fields: [
          {
            id: 'bsmv-iban',
            type: 'iban',
            label: 'IBAN',
            placeholder: 'z.B. DE89 3704 0044 0532 0130 00',
            required: true,
          },
          {
            id: 'bsmv-tax-id',
            type: 'text',
            label: 'Steuer-ID',
            placeholder: 'z.B. 12 345 678 901',
            required: false,
          },
          {
            id: 'bsmv-compensation-type',
            type: 'select',
            label: 'Verguetungsart',
            required: true,
            options: [
              {
                label: 'Aufwandsentschaedigung',
                value: 'aufwandsentschaedigung',
              },
              { label: 'Ehrenamtspauschale', value: 'ehrenamtspauschale' },
            ],
          },
        ],
      },
      {
        id: 'sec-bsmv-documents',
        title: 'Dokumente & Einverstaendnisse',
        description:
          'Bitte bestaetige die folgenden Dokumente, um das Onboarding abzuschliessen.',
        icon: 'FileCheck',
        fields: [
          {
            id: 'bsmv-privacy',
            type: 'document-acknowledgement',
            label: 'Datenschutzerklaerung',
            documentUrl: '/datenschutz',
            documentLabel: 'Datenschutzerklaerung lesen',
            required: true,
          },
          {
            id: 'bsmv-volunteer-agreement',
            type: 'document-acknowledgement',
            label: 'Freiwilligenvereinbarung',
            documentUrl: '/freiwilligenvereinbarung',
            documentLabel: 'Freiwilligenvereinbarung lesen',
            required: true,
          },
          {
            id: 'bsmv-compensation-agreement',
            type: 'document-acknowledgement',
            label: 'Verguetungsvereinbarung',
            documentUrl: '/verguetungsvereinbarung',
            documentLabel: 'Verguetungsvereinbarung lesen',
            required: true,
          },
          {
            id: 'bsmv-newsletter',
            type: 'checkbox',
            label: 'Ich moechte den Newsletter erhalten',
            description:
              'Wir informieren Sie regelmaessig ueber Neuigkeiten und Veranstaltungen.',
            required: false,
          },
        ],
      },
    ],
    settings: {
      submitButtonLabel: 'Onboarding abschliessen',
      successTitle: 'Willkommen im Team!',
      successMessage:
        'Ihr Onboarding wurde erfolgreich abgeschlossen. Ihre Verguetungsdaten wurden gespeichert.',
      allowEmbed: true,
    },
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-01-25T10:00:00.000Z',
  },
];
