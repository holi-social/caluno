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
  shiftsAdminUrl,
} from './shared';

export interface ShiftInstanceJoinedTemplateData {
  organizationUnitId: string;
  organizationUnitName: string;
  shiftTitle: string;
  volunteerName: string;
  recipientFirstName: string;
  startsAt: Date;
}

export async function shiftInstanceJoinedTemplate(
  data: ShiftInstanceJoinedTemplateData,
): Promise<{ subject: string; html: string }> {
  const firstName = escapeHtml(data.recipientFirstName);
  const organizationUnitName = escapeHtml(data.organizationUnitName);
  const shiftTitle = escapeHtml(data.shiftTitle);
  const volunteerName = escapeHtml(data.volunteerName);
  const startsAt = escapeHtml(
    new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(data.startsAt),
  );
  const shiftsUrl = shiftsAdminUrl(data.organizationUnitId);

  const body = card(`
    ${heading('Someone joined a shift')}
    ${paragraph(
      `Hi ${firstName}, a volunteer signed up for a shift you can manage.`,
      { padding: '0 0 20px' },
    )}
    ${detailItem('Volunteer', volunteerName)}
    ${detailItem('Shift', shiftTitle)}
    ${detailItem('Organization', organizationUnitName)}
    ${detailItem('Starts', startsAt, { last: true })}
    ${button({ href: shiftsUrl, label: 'View shift schedule' })}
    ${divider()}
    ${note('The schedule has already been updated with this volunteer.')}
  `);

  return renderEmail({
    templateName: 'shiftInstanceJoinedTemplate',
    subject: `${data.shiftTitle}: ${data.volunteerName} joined`,
    previewText: `${volunteerName} joined ${shiftTitle} in ${organizationUnitName} on ${startsAt}.`,
    body,
    footerNote: `You are receiving this because you can manage shifts on ${emailTheme.brandName}.`,
  });
}
