import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  divider,
  emailTheme,
  escapeHtml,
  formatMultilineHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  strong,
  volunteerProfileUrl,
} from './shared';

export interface DocumentDeclinedByOrgTemplateData {
  organizationName: string;
  recipientFirstName: string;
  documentName: string;
  reason: string;
}

/**
 * The organisation declined a document the volunteer had already signed. The
 * document is dead; the volunteer would otherwise have no way to learn that.
 */
export async function documentDeclinedByOrgTemplate(
  data: DocumentDeclinedByOrgTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const documentName = escapeHtml(data.documentName);
  const reason = formatMultilineHtml(data.reason);
  const documentsUrl = volunteerProfileUrl();
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('documentDeclinedByOrg.heading'))}
    ${paragraph(
      `${t('documentDeclinedByOrg.greeting', { firstName })} ${strong(documentName)} ${t('documentDeclinedByOrg.from', { organizationName })}`,
    )}
    ${paragraph(t('documentDeclinedByOrg.reasonLabel'))}
    ${note(reason)}
    ${divider()}
    ${button({
      href: documentsUrl,
      label: t('documentDeclinedByOrg.buttonLabel'),
    })}
    ${divider()}
    ${note(t('documentDeclinedByOrg.note'))}
  `);

  return renderEmail({
    templateName: 'documentDeclinedByOrgTemplate',
    subject: t('documentDeclinedByOrg.subject', {
      documentName: data.documentName,
      organizationName: data.organizationName,
    }),
    previewText: t('documentDeclinedByOrg.previewText', {
      documentName: data.documentName,
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('documentDeclinedByOrg.footerNote', {
      organizationName: data.organizationName,
      brandName,
    }),
  });
}
