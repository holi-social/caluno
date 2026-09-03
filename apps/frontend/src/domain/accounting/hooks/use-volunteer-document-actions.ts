'use client';

import {
  useDeclineContract,
  useDeclineInvoice,
  useSignContract,
  useSignInvoice,
} from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { VolunteerDocument } from '../lib/volunteer-documents.utils';

/**
 * Sign / decline / download for one of the volunteer's documents. Shared by
 * the membership page's card list and the document preview so both flows
 * behave identically (one-tap sign, decline with written reason, always-
 * downloadable).
 */
export function useVolunteerDocumentActions() {
  const t = useTranslations('MembershipDetail.documents');

  const signContract = useSignContract();
  const signInvoice = useSignInvoice();
  const declineContract = useDeclineContract();
  const declineInvoice = useDeclineInvoice();

  function nameOf(document: Pick<VolunteerDocument, 'nameKey'>): string {
    return t(`names.${document.nameKey}`);
  }

  function sign(document: Pick<VolunteerDocument, 'id' | 'kind' | 'nameKey'>) {
    const name = nameOf(document);
    const mutation = document.kind === 'contract' ? signContract : signInvoice;
    mutation.mutate(document.id, {
      onSuccess: () => toast.success(t('toasts.signed', { name })),
      onError: () => toast.error(t('toasts.signedError', { name })),
    });
  }

  function decline(
    document: Pick<VolunteerDocument, 'id' | 'kind' | 'nameKey'>,
    reason: string,
  ) {
    const name = nameOf(document);
    const onSuccess = () => toast.success(t('toasts.declined', { name }));
    const onError = () => toast.error(t('toasts.declinedError', { name }));
    if (document.kind === 'contract') {
      declineContract.mutate(
        { contractId: document.id, reason },
        { onSuccess, onError },
      );
    } else {
      declineInvoice.mutate(
        { invoiceId: document.id, reason },
        { onSuccess, onError },
      );
    }
  }

  function download(doc: {
    downloadUrl?: string | null;
    periodLabel: string;
    nameKey: VolunteerDocument['nameKey'];
  }) {
    if (!doc.downloadUrl) {
      toast.error(t('toasts.downloadUnavailable'));
      return;
    }
    const a = document.createElement('a');
    a.href = doc.downloadUrl;
    a.download = `${doc.periodLabel}-${nameOf(doc)}.pdf`;
    a.click();
  }

  return { sign, decline, download };
}
