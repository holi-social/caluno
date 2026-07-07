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

export interface OrganizationCreatedTemplateData {
  organizationUnitId: string;
  organizationName: string;
  recipientFirstName: string;
}

export async function organizationCreatedTemplate(
  data: OrganizationCreatedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const organizationUrl = organizationAdminUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('organizationCreated.heading'))}
    ${paragraph(
      `${t('organizationCreated.greetingBefore', { firstName })} ${strong(organizationName)} ${t('organizationCreated.greetingAfter', { brandName })}`,
    )}
    ${button({
      href: organizationUrl,
      label: t('organizationCreated.buttonLabel', {
        organizationName: data.organizationName,
      }),
    })}
    ${divider()}
    ${heading(t('organizationCreated.nextStepsHeading'), { size: '18px', padding: '0 0 16px', letterSpacing: '-0.01em' })}
    ${orderedListItem(1, `${strong(t('organizationCreated.step1Title'))}: ${t('organizationCreated.step1Detail')}`)}
    ${orderedListItem(2, `${strong(t('organizationCreated.step2Title'))}: ${t('organizationCreated.step2Detail')}`)}
    ${orderedListItem(3, `${strong(t('organizationCreated.step3Title'))}: ${t('organizationCreated.step3Detail')}`, { last: true })}
  `);

  return renderEmail({
    templateName: 'organizationCreatedTemplate',
    subject: t('organizationCreated.subject', {
      organizationName: data.organizationName,
    }),
    previewText: t('organizationCreated.previewText', {
      organizationName: data.organizationName,
    }),
    body,
    footerNote: t('organizationCreated.footerNote', { brandName }),
  });
}
