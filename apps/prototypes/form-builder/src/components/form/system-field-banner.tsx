import { Alert, AlertDescription } from '@repo/ui';
import { UserCircle2 } from 'lucide-react';

/**
 * Volunteer-facing banner rendered above a system-requirement field when
 * its value is pulled from the volunteer's profile (filled previously
 * at a different sub-org). Editing the field will overwrite the profile
 * value.
 */
export function SystemFieldBanner() {
  return (
    <Alert>
      <UserCircle2 />
      <AlertDescription>
        Diese Information kommt aus Deinem Profil. Wenn Du sie hier
        aenderst, aktualisieren wir sie auch fuer andere Sub-Organisationen.
      </AlertDescription>
    </Alert>
  );
}
