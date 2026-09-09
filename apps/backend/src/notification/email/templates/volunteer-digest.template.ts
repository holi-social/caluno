import type { EmailTemplateContext } from '../../../i18n/email-translate';
import type { ShiftNeedReason } from '../../../shift/utils/volunteer-digest-ranking';
import {
  button,
  card,
  discoverShiftsUrl,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  myInvitationsUrl,
  paragraph,
  renderEmail,
  shiftCard,
  shiftPublicUrl,
  volunteeringHomeUrl,
} from './shared';

export interface VolunteerDigestShiftRow {
  instanceId: string;
  shiftId: string;
  title: string;
  organizationUnitName: string;
  startsAt: Date;
  endsAt: Date;
  imageUrl: string | null;
}

export interface NeedsVolunteersRow extends VolunteerDigestShiftRow {
  reason: ShiftNeedReason;
}

export interface NeedsVolunteersGroup {
  organizationName: string;
  rows: NeedsVolunteersRow[];
}

export interface VolunteerDigestTemplateData {
  recipientFirstName: string;
  /** Shifts the volunteer is confirmed (JOINED) on, starting within the next 7 days. */
  myShifts: VolunteerDigestShiftRow[];
  /** Shifts the volunteer has an unanswered invite for, starting within the next 7 days. */
  pendingInvites: VolunteerDigestShiftRow[];
  /** Understaffed/open shifts ranked by urgency, grouped by organisation. */
  needsVolunteersGroups: NeedsVolunteersGroup[];
}

function reasonLabel(
  reason: ShiftNeedReason,
  t: EmailTemplateContext['t'],
): string {
  switch (reason.kind) {
    case 'MINIMUM_SHORTFALL':
      return t('volunteerDigest.reasonNeedsMore', { count: reason.needed });
    case 'NO_VOLUNTEERS_YET':
      return t('volunteerDigest.reasonNoVolunteersYet');
    case 'HAS_ROOM':
      return t('volunteerDigest.reasonHasRoom');
  }
}

export async function volunteerDigestTemplate(
  data: VolunteerDigestTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate, formatTime } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;

  const rowWhen = (startsAt: Date, endsAt: Date) =>
    t('volunteerDigest.rowWhen', {
      date: formatDate(startsAt),
      timeRange: `${formatTime(startsAt)} – ${formatTime(endsAt)}`,
    });

  const renderRows = <TRow extends VolunteerDigestShiftRow>(
    rows: TRow[],
    metaFor?: (row: TRow) => string,
  ): string =>
    rows
      .map((row, index) =>
        shiftCard({
          href: shiftPublicUrl(row.shiftId, row.instanceId),
          imageUrl: row.imageUrl,
          title: escapeHtml(row.title),
          subtitle: `${escapeHtml(row.organizationUnitName)} · ${rowWhen(row.startsAt, row.endsAt)}`,
          meta: metaFor?.(row),
          last: index === rows.length - 1,
        }),
      )
      .join('');

  const sections: string[] = [];

  if (data.myShifts.length > 0) {
    sections.push(`
      ${heading(t('volunteerDigest.myShiftsHeading'), { size: '18px', padding: '0 0 8px' })}
      ${renderRows(data.myShifts)}
      ${button({ href: volunteeringHomeUrl(), label: t('volunteerDigest.myShiftsSeeAll'), padding: '16px 0 0' })}
    `);
  }

  if (data.pendingInvites.length > 0) {
    sections.push(`
      ${heading(t('volunteerDigest.pendingInvitesHeading'), { size: '18px', padding: '0 0 8px' })}
      ${renderRows(data.pendingInvites)}
      ${button({ href: myInvitationsUrl(), label: t('volunteerDigest.pendingInvitesSeeAll'), padding: '16px 0 0' })}
    `);
  }

  const needsVolunteersGroupsWithRows = data.needsVolunteersGroups.filter(
    (group) => group.rows.length > 0,
  );
  if (needsVolunteersGroupsWithRows.length > 0) {
    const groupSections = needsVolunteersGroupsWithRows
      .map(
        (group) => `
          ${heading(escapeHtml(group.organizationName), { size: '14px', padding: '12px 0 4px', color: emailTheme.colors.muted })}
          ${renderRows(group.rows, (row) => reasonLabel(row.reason, t))}
        `,
      )
      .join('');

    sections.push(`
      ${heading(t('volunteerDigest.needsVolunteersHeading'), { size: '18px', padding: '0 0 4px' })}
      ${groupSections}
      ${button({ href: discoverShiftsUrl(), label: t('volunteerDigest.needsVolunteersSeeAll'), padding: '16px 0 0' })}
    `);
  }

  const body = card(`
    ${heading(t('volunteerDigest.heading'))}
    ${paragraph(t('volunteerDigest.greeting', { firstName }), { padding: '0 0 20px' })}
    ${sections.join(divider('24px 0'))}
  `);

  return renderEmail({
    templateName: 'volunteerDigestTemplate',
    subject: t('volunteerDigest.subject', { brandName }),
    previewText: t('volunteerDigest.previewText'),
    body,
    footerNote: t('volunteerDigest.footerNote', { brandName }),
  });
}
