import {
  FileCheck,
  List,
  Mail,
  MapPin,
  User,
} from 'lucide-react';
import type { FormField } from './types';

/**
 * Derives a block icon from its field types/labels.
 * Priority order:
 *   1. Name-related fields (Vorname, Nachname, Name) → User
 *   2. Email or phone fields → Mail
 *   3. Address-related fields (Strasse, PLZ, Stadt, Adresse) → MapPin
 *   4. Document fields → FileCheck
 *   5. Fallback → List
 */
export function getBlockIcon(
  fields: FormField[],
  className = 'size-5',
): React.ReactNode {
  const hasName = fields.some((f) => {
    if (f.type === 'vorname' || f.type === 'nachname') return true;
    const l = f.label.toLowerCase();
    return l.includes('vorname') || l.includes('nachname') || l.includes('name');
  });
  if (hasName) return <User className={className} />;

  const hasContact = fields.some(
    (f) => f.type === 'email' || f.type === 'phone',
  );
  if (hasContact) return <Mail className={className} />;

  const hasAddress = fields.some((f) => {
    const l = f.label.toLowerCase();
    return (
      f.type === 'plz' ||
      l.includes('strasse') ||
      l.includes('stadt') ||
      l.includes('adresse') ||
      l.includes('hausnummer') ||
      l.includes('ort') ||
      l.includes('plz')
    );
  });
  if (hasAddress) return <MapPin className={className} />;

  const hasDocument = fields.some(
    (f) => f.type === 'document-acknowledgement',
  );
  if (hasDocument) return <FileCheck className={className} />;

  return <List className={className} />;
}
