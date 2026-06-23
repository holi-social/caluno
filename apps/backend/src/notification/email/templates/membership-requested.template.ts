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
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationUnitName);
  const requesterName = escapeHtml(data.requesterName);
  const volunteersUrl = volunteersAdminUrl(data.organizationUnitId);

  const body = card(`
    ${heading('New membership request')}
    ${paragraph(
      `Hi ${firstName}, ${strong(requesterName)} has requested to join ${strong(organizationName)}. Review the request when you have a moment so they know whether they can start volunteering.`,
    )}
    ${button({ href: volunteersUrl, label: 'Review request' })}
    ${divider()}
    ${note('Pending requests stay open until an admin approves or rejects them.')}
  `);

  return renderEmail({
    templateName: 'membershipRequestedTemplate',
    subject: `New membership request for ${data.organizationUnitName}`,
    previewText: `${requesterName} wants to join ${organizationName}.`,
    body,
    footerNote: `You are receiving this because you can review membership requests on ${emailTheme.brandName}.`,
  });
}
