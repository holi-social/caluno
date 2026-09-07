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
  reimbursementsAdminUrl,
  renderEmail,
  strong,
} from './shared';

export interface DocumentDeclinedByVolunteerTemplateData {
  organizationUnitId: string;
  recipientFirstName: string;
  volunteerName: string;
  documentName: string;
  reason: string;
}

/**
 * The volunteer declined a document (their own signature step) with a
 * reason. Whoever manages accounting needs to know so they can correct and
 * reissue it — otherwise the decline just sits there, invisible (VOLI-1246).
 */
export async function documentDeclinedByVolunteerTemplate(
  data: DocumentDeclinedByVolunteerTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const volunteerName = escapeHtml(data.volunteerName);
  const documentName = escapeHtml(data.documentName);
  const reason = formatMultilineHtml(data.reason);
  const reimbursementsUrl = reimbursementsAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('documentDeclinedByVolunteer.heading'))}
    ${paragraph(
      `${t('documentDeclinedByVolunteer.greeting', { firstName })} ${strong(volunteerName)} ${t('documentDeclinedByVolunteer.declined', { documentName })}`,
    )}
    ${paragraph(t('documentDeclinedByVolunteer.reasonLabel'))}
    ${note(reason)}
    ${divider()}
    ${button({
      href: reimbursementsUrl,
      label: t('documentDeclinedByVolunteer.buttonLabel'),
    })}
    ${divider()}
    ${note(t('documentDeclinedByVolunteer.note'))}
  `);

  return renderEmail({
    templateName: 'documentDeclinedByVolunteerTemplate',
    subject: t('documentDeclinedByVolunteer.subject', {
      volunteerName: data.volunteerName,
      documentName: data.documentName,
    }),
    previewText: t('documentDeclinedByVolunteer.previewText', {
      volunteerName: data.volunteerName,
      documentName: data.documentName,
    }),
    body,
    footerNote: t('documentDeclinedByVolunteer.footerNote', { brandName }),
  });
}
