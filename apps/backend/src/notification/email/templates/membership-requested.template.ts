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
  volunteersAdminUrl,
} from './shared';

export interface MembershipRequestedTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  requesterName: string;
  recipientFirstName: string;
}

export async function membershipRequestedTemplate(
  data: MembershipRequestedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationUnitName);
  const requesterName = escapeHtml(data.requesterName);
  const volunteersUrl = volunteersAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('membershipRequested.heading'))}
    ${paragraph(
      `${t('membershipRequested.greetingPrefix', { firstName })} ${strong(requesterName)} ${t('membershipRequested.greetingBetweenRequesterAndOrg')} ${strong(organizationName)}. ${t('membershipRequested.greetingSuffix')}`,
    )}
    ${button({ href: volunteersUrl, label: t('membershipRequested.buttonLabel') })}
    ${divider()}
    ${note(t('membershipRequested.note'))}
  `);

  return renderEmail({
    templateName: 'membershipRequestedTemplate',
    subject: t('membershipRequested.subject', {
      organizationName: data.organizationUnitName,
    }),
    previewText: t('membershipRequested.previewText', {
      requesterName: data.requesterName,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('membershipRequested.footerNote', { brandName }),
  });
}
