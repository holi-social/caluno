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

export interface MembershipRemovedTemplateData {
  organizationName: string;
  recipientFirstName: string;
}

export async function membershipRemovedTemplate(
  data: MembershipRemovedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('membershipRemoved.heading'))}
    ${paragraph(
      `${t('membershipRemoved.greetingBefore', { firstName })} ${strong(organizationName)} ${t('membershipRemoved.greetingAfter')}`,
    )}
    ${divider()}
    ${note(t('membershipRemoved.note'))}
  `);

  return renderEmail({
    templateName: 'membershipRemovedTemplate',
    subject: t('membershipRemoved.subject', {
      organizationName: data.organizationName,
    }),
    previewText: t('membershipRemoved.previewText', {
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('membershipRemoved.footerNote', {
      organizationName: data.organizationName,
      brandName,
    }),
  });
}
