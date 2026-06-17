import {
  button,
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  renderEmail,
  text,
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
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationUnitName);
  const requesterName = escapeHtml(data.requesterName);
  const volunteersUrl = volunteersAdminUrl(data.organizationUnitId);

  const body = card(`
    ${heading('New membership request')}
    ${text(
      `Hi ${firstName}, <strong style="color:${emailTheme.colors.ink}">${requesterName}</strong> has requested to join <strong style="color:${emailTheme.colors.ink}">${organizationName}</strong>. Review the request when you have a moment.`,
      { color: emailTheme.colors.muted, padding: '0 0 24px' },
    )}
    ${button({ href: volunteersUrl, label: 'Review request' })}
    ${divider()}
    ${text(
      'You are receiving this because you can review membership requests for this organization.',
      { size: '14px', color: emailTheme.colors.muted },
    )}
  `);

  return renderEmail({
    templateName: 'membershipRequestedTemplate',
    subject: `New membership request for ${data.organizationUnitName}`,
    previewText: `${requesterName} wants to join ${organizationName}.`,
    body,
    footerNote: `You are receiving this because you can review membership requests on ${emailTheme.brandName}.`,
  });
}
