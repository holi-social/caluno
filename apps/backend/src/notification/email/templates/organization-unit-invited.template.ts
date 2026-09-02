import type { EmailTemplateContext } from '../../../i18n/email-translate';
import {
  button,
  card,
  emailTheme,
  escapeHtml,
  heading,
  paragraph,
  publicOrganizationUnitUrl,
  renderEmail,
} from './shared';

export interface OrganizationUnitInvitedTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  recipientFirstName: string;
}

export async function organizationUnitInvitedTemplate(
  data: OrganizationUnitInvitedTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const orgUnitUrl = publicOrganizationUnitUrl(data.organizationUnitId);
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('organizationUnitInvited.heading', { organizationUnitName }))}
    ${paragraph(
      t('organizationUnitInvited.greeting', {
        firstName,
        organizationUnitName,
      }),
    )}
    ${button({
      href: orgUnitUrl,
      label: t('organizationUnitInvited.buttonLabel', { organizationUnitName }),
    })}
  `);

  return renderEmail({
    templateName: 'organizationUnitInvitedTemplate',
    subject: t('organizationUnitInvited.subject', { organizationUnitName }),
    previewText: t('organizationUnitInvited.previewText', {
      organizationUnitName,
    }),
    body,
    footerNote: t('organizationUnitInvited.footerNote', { brandName }),
  });
}
