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
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const organizationUrl = organizationAdminUrl(data.organizationUnitId);

  const body = card(`
    ${heading('Welcome aboard')}
    ${paragraph(
      `Hi ${firstName}, your membership request for ${strong(organizationName)} has been approved. You can now browse shifts and sign up when something fits your availability.`,
    )}
    ${button({ href: organizationUrl, label: `Open ${organizationName}` })}
    ${divider()}
    ${heading('What to do next', { size: '18px', padding: '0 0 16px', letterSpacing: '-0.01em' })}
    ${orderedListItem(1, `${strong('Complete your profile')}: make sure your details are up to date.`)}
    ${orderedListItem(2, `${strong('Browse open shifts')}: find times and roles that work for you.`)}
    ${orderedListItem(3, `${strong('Sign up')}: join a shift and you are all set.`, { last: true })}
  `);

  return renderEmail({
    templateName: 'membershipApprovedTemplate',
    subject: `You're approved for ${data.organizationName}`,
    previewText: `Your membership to ${organizationName} has been approved. Browse shifts and sign up when you are ready.`,
    body,
    footerNote: `You are receiving this because your membership request to ${organizationName} was approved on ${emailTheme.brandName}.`,
  });
}
