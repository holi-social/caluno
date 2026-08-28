import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  detailItem,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
  volunteersAdminUrl,
} from './shared';

export interface MembershipLeftTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  volunteerName: string;
  recipientFirstName: string;
}

export async function membershipLeftTemplate(
  data: MembershipLeftTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationUnitName);
  const volunteerName = escapeHtml(data.volunteerName);
  const volunteersUrl = volunteersAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('membershipLeft.heading'))}
    ${paragraph(t('membershipLeft.greeting', { firstName }), {
      padding: '0 0 20px',
    })}
    ${detailItem(t('membershipLeft.detailVolunteer'), volunteerName)}
    ${detailItem(t('membershipLeft.detailOrganization'), organizationName, {
      last: true,
    })}
    ${button({ href: volunteersUrl, label: t('membershipLeft.buttonLabel') })}
    ${divider()}
    ${note(t('membershipLeft.note'))}
  `);

  return renderEmail({
    templateName: 'membershipLeftTemplate',
    subject: t('membershipLeft.subject', {
      volunteerName: data.volunteerName,
      organizationName: data.organizationUnitName,
    }),
    previewText: t('membershipLeft.previewText', {
      volunteerName: data.volunteerName,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('membershipLeft.footerNote', { brandName }),
  });
}
