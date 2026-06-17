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

export interface OrganizationCreatedTemplateData {
  organizationUnitId: string;
  organizationName: string;
  recipientFirstName: string;
}

export async function organizationCreatedTemplate(
  data: OrganizationCreatedTemplateData,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationName = escapeHtml(data.organizationName);
  const organizationUrl = organizationAdminUrl(data.organizationUnitId);

  const body = card(`
    ${heading('Your organization is ready')}
    ${text(
      `Hi ${firstName}, <strong style="color:${emailTheme.colors.ink}">${organizationName}</strong> is now set up on ${emailTheme.brandName}. You can start inviting teammates and scheduling shifts right away.`,
      { color: emailTheme.colors.muted, padding: '0 0 24px' },
    )}
    ${button({ href: organizationUrl, label: `Open ${organizationName}` })}
    ${divider()}
    ${heading('What to do next', { size: '18px', padding: '0 0 16px', letterSpacing: '-0.01em' })}
    ${orderedListItem(1, '<strong>Invite your team</strong>: add admins and coordinators so you are not scheduling alone.')}
    ${orderedListItem(2, '<strong>Create your first shifts</strong>: set the times, roles, and how many volunteers you need.')}
    ${orderedListItem(3, '<strong>Bring in volunteers</strong>: share your sign-up link and watch the schedule fill in.', { last: true })}
  `);

  return renderEmail({
    templateName: 'organizationCreatedTemplate',
    subject: `Your organization "${data.organizationName}" is ready`,
    previewText: `${organizationName} is ready. Invite your team and start scheduling shifts.`,
    body,
    footerNote: `You are receiving this because you created an organization on ${emailTheme.brandName}.`,
  });
}
