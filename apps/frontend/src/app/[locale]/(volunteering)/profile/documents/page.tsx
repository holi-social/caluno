import { getTranslations } from 'next-intl/server';
import { VolunteerMyDocuments } from '@/domain/accounting/components/volunteer-my-documents';
import { VolunteerMyDocumentsHeader } from '@/domain/accounting/components/volunteer-my-documents-header';

/**
 * The volunteer's cross-org "My documents" page — every document they are
 * party to across all their organizations, grouped per org. Reached from
 * the profile dropdown ("Meine Dokumente").
 */
export default async function MyDocumentsPage() {
  const t = await getTranslations('MyDocuments');

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30">
        <VolunteerMyDocumentsHeader title={t('title')} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <VolunteerMyDocuments />
      </div>
    </div>
  );
}
