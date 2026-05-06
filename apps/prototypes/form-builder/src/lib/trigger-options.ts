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

// --- Rule schema (synthetic IDs of the form "trigger:location") ---

export const RULE_TRIGGER_TYPES: { value: string; label: string }[] = [
  { value: 'join', label: 'Beitritt zur Organisation' },
  { value: 'shift', label: 'Schichtanmeldung' },
];

export const RULE_LOCATIONS: { value: string; label: string }[] = [
  { value: 'current', label: 'Aktueller Standort' },
  { value: 'ks13', label: 'Karlstraße 13' },
  { value: 'ea', label: 'Abteilung EA' },
  { value: 'berlin', label: 'Standort Berlin' },
  { value: 'hamburg', label: 'Standort Hamburg' },
];

const RULE_TRIGGER_MAP = new Map(RULE_TRIGGER_TYPES.map((t) => [t.value, t]));
const RULE_LOCATION_MAP = new Map(RULE_LOCATIONS.map((l) => [l.value, l]));

/**
 * Resolve a rule ID to a human label.
 *
 * Handles three input shapes:
 * 1. Legacy trigger IDs (e.g. "join-org", "shift:ea-montag-vormittag") via TRIGGER_MAP.
 * 2. Synthetic rule IDs of the form "<trigger>:<location>" (e.g. "join:current"),
 *    rendered as "Trigger label, Location label".
 * 3. Anything else: returns the raw ID so the UI doesn't disappear silently.
 */
export function formatRuleId(id: string): string {
  const legacy = TRIGGER_MAP.get(id);
  if (legacy) return legacy.label;

  const parts = id.split(':');
  if (parts.length === 2) {
    const [triggerValue, locationValue] = parts as [string, string];
    const trigger = RULE_TRIGGER_MAP.get(triggerValue);
    const location = RULE_LOCATION_MAP.get(locationValue);
    if (trigger && location) {
      return `${trigger.label}, ${location.label}`;
    }
  }

  return id;
}
