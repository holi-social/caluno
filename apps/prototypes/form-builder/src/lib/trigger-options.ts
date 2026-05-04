/** Prototype-only: hardcoded list of triggers a form can be applied to. */

export type TriggerOption = { id: string; label: string; group: string };

export const TRIGGER_OPTIONS: TriggerOption[] = [
  { id: 'join-org', label: 'Beitritt zur Organisation', group: 'Allgemein' },
  {
    id: 'shift:ea-montag-vormittag',
    label: 'Abteilung EA – Montag Vormittag',
    group: 'Schichten',
  },
  {
    id: 'shift:ea-mittwoch-nachmittag',
    label: 'Abteilung EA – Mittwoch Nachmittag',
    group: 'Schichten',
  },
  {
    id: 'shift:ks13-dienstag-abend',
    label: 'Karlstrasse 13 – Dienstag Abend',
    group: 'Schichten',
  },
  {
    id: 'shift:ks13-freitag-ganztags',
    label: 'Karlstrasse 13 – Freitag Ganztags',
    group: 'Schichten',
  },
];

export const TRIGGER_MAP = new Map(TRIGGER_OPTIONS.map((o) => [o.id, o]));
