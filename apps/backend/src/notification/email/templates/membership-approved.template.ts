import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  orderedListItem,
  organizationAdminUrl,
  paragraph,
  renderEmail,
  strong,
} from './shared';

export interface MembershipApprovedTemplateData {
  organizationUnitId: string;
  organizationName: string;
  recipientFirstName: string;
}

export async function membershipApprovedTemplate(
  data: MembershipApprovedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const organizationUrl = organizationAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('membershipApproved.heading'))}
    ${paragraph(
      `${t('membershipApproved.greetingBefore', { firstName })} ${strong(organizationName)} ${t('membershipApproved.greetingAfter')}`,
    )}
    ${button({
      href: organizationUrl,
      label: t('membershipApproved.buttonLabel', {
        organizationName: data.organizationName,
      }),
    })}
    ${divider()}
    ${heading(t('membershipApproved.nextStepsHeading'), { size: '18px', padding: '0 0 16px', letterSpacing: '-0.01em' })}
    ${orderedListItem(1, `${strong(t('membershipApproved.step1Title'))}: ${t('membershipApproved.step1Detail')}`)}
    ${orderedListItem(2, `${strong(t('membershipApproved.step2Title'))}: ${t('membershipApproved.step2Detail')}`)}
    ${orderedListItem(3, `${strong(t('membershipApproved.step3Title'))}: ${t('membershipApproved.step3Detail')}`, { last: true })}
  `);

  return renderEmail({
    templateName: 'membershipApprovedTemplate',
    subject: t('membershipApproved.subject', {
      organizationName: data.organizationName,
    }),
    previewText: t('membershipApproved.previewText', {
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('membershipApproved.footerNote', {
      organizationName: data.organizationName,
      brandName,
    }),
  });
}
