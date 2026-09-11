import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  strong,
  volunteerProfileUrl,
} from './shared';

export interface DocumentAwaitingSignatureTemplateData {
  organizationName: string;
  recipientFirstName: string;
  documentName: string;
}

/**
 * The one proactive email the volunteer gets: a document (contract or
 * timesheet) is waiting for their signature. Everything else — generation,
 * final countersignature — settles quietly.
 */
export async function documentAwaitingSignatureTemplate(
  data: DocumentAwaitingSignatureTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const documentName = escapeHtml(data.documentName);
  const documentsUrl = volunteerProfileUrl();
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('documentAwaitingSignature.heading'))}
    ${paragraph(
      `${t('documentAwaitingSignature.greeting', { firstName })} ${strong(documentName)} ${t('documentAwaitingSignature.from', { organizationName })}`,
    )}
    ${paragraph(t('documentAwaitingSignature.detail'))}
    ${button({
      href: documentsUrl,
      label: t('documentAwaitingSignature.buttonLabel'),
    })}
    ${divider()}
    ${note(t('documentAwaitingSignature.note'))}
  `);

  return renderEmail({
    templateName: 'documentAwaitingSignatureTemplate',
    subject: t('documentAwaitingSignature.subject', {
      documentName: data.documentName,
      organizationName: data.organizationName,
    }),
    previewText: t('documentAwaitingSignature.previewText', {
      documentName: data.documentName,
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('documentAwaitingSignature.footerNote', {
      organizationName: data.organizationName,
      brandName,
    }),
  });
}
