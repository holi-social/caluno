import type { MembershipApprovedPayload } from '../../payloads/membership-approved.payload';
import {
  button,
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  orderedListItem,
  organizationAdminUrl,
  renderEmail,
  text,
} from './shared';

export interface MembershipApprovedTemplateOptions {
  appUrl?: string;
}

export async function membershipApprovedTemplate(
  payload: MembershipApprovedPayload,
  options: MembershipApprovedTemplateOptions = {},
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(payload.memberFirstName);
  const organizationName = escapeHtml(payload.organizationName);
  const organizationUrl = organizationAdminUrl(
    options.appUrl,
    payload.organizationUnitId,
  );

  const body = card(`
    ${heading('Welcome aboard')}
    ${text(
      `Hi ${firstName}, your membership request for <strong style="color:${emailTheme.colors.ink}">${organizationName}</strong> has been approved. You can now view shifts and start volunteering.`,
      { color: emailTheme.colors.muted, padding: '0 0 24px' },
    )}
    ${button({ href: organizationUrl, label: `Open ${organizationName}` })}
    ${divider()}
    ${heading('What to do next', { size: '18px', padding: '0 0 16px', letterSpacing: '-0.01em' })}
    ${orderedListItem(1, '<strong>Complete your profile</strong>: make sure your details are up to date.')}
    ${orderedListItem(2, '<strong>Browse open shifts</strong>: find times and roles that work for you.')}
    ${orderedListItem(3, '<strong>Sign up</strong>: join a shift and you are all set.', { last: true })}
  `);

  return renderEmail({
    templateName: 'membershipApprovedTemplate',
    subject: `Your membership to "${payload.organizationName}" has been approved`,
    previewText: `Your membership to ${organizationName} has been approved. Browse shifts and start volunteering.`,
    body,
    footerNote: `You are receiving this because your membership request to ${organizationName} was approved on ${emailTheme.brandName}.`,
  });
}
