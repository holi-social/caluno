import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  strong,
} from './shared';

export interface MembershipRejectedTemplateData {
  organizationName: string;
  recipientFirstName: string;
  rejectionReason: string | null;
}

export async function membershipRejectedTemplate(
  data: MembershipRejectedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const brandName = emailTheme.brandName;
  const rejectionReason = data.rejectionReason?.trim();

  const body = card(`
    ${heading(t('membershipRejected.heading'))}
    ${paragraph(
      `${t('membershipRejected.greetingBefore', { firstName })} ${strong(organizationName)} ${t('membershipRejected.greetingAfter')}`,
    )}
    ${
      rejectionReason
        ? `${divider()}${note(`${strong(t('membershipRejected.reasonLabel'))} ${escapeHtml(rejectionReason)}`)}`
        : ''
    }
    ${divider()}
    ${paragraph(t('membershipRejected.outro'))}
  `);

  return renderEmail({
    templateName: 'membershipRejectedTemplate',
    subject: t('membershipRejected.subject', {
      organizationName: data.organizationName,
    }),
    previewText: t('membershipRejected.previewText', {
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('membershipRejected.footerNote', {
      organizationName: data.organizationName,
      brandName,
    }),
  });
}
