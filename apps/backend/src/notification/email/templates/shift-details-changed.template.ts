import type { EmailTemplateContext } from '../../../i18n/email-translate';
import type { ChangedField } from '../../payloads/shift-details-changed.payload';
import {
  card,
  divider,
  emailTheme,
  escapeHtml,
  heading,
  note,
  paragraph,
  renderEmail,
} from './shared';

export interface ShiftDetailsChangedTemplateData {
  organizationUnitName: string;
  shiftTitle: string;
  recipientFirstName: string;
  fromDate?: Date | null;
  changes: ChangedField[];
}

function renderChange(
  change: ChangedField,
  { t }: EmailTemplateContext,
): string {
  const label = t(`shiftDetailsChanged.field.${change.field}`);

  if (change.kind === 'text') {
    const text = change.text ? escapeHtml(change.text) : '';
    return `${escapeHtml(label)}: ${t('shiftDetailsChanged.updated')} — ${text}`;
  }

  const previous = change.previous ? escapeHtml(change.previous) : '—';
  const current = change.current ? escapeHtml(change.current) : '—';
  return `${escapeHtml(label)}: ${previous} → ${current}`;
}

export async function shiftDetailsChangedTemplate(
  data: ShiftDetailsChangedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t, formatDate } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;
  const shiftTitle = escapeHtml(data.shiftTitle);
  const organizationUnitName = escapeHtml(data.organizationUnitName);

  const changesHtml = data.changes
    .map((change) =>
      paragraph(renderChange(change, context), { padding: '0 0 4px' }),
    )
    .join('');

  const headingKey = data.fromDate
    ? 'shiftDetailsChanged.seriesHeading'
    : 'shiftDetailsChanged.heading';
  const greetingKey = data.fromDate
    ? 'shiftDetailsChanged.seriesGreeting'
    : 'shiftDetailsChanged.greeting';

  const body = card(`
    ${heading(t(headingKey))}
    ${paragraph(
      t(greetingKey, { firstName, shiftTitle, organizationUnitName }),
      {
        padding: '0 0 16px',
      },
    )}
    ${
      data.fromDate
        ? paragraph(
            t('shiftDetailsChanged.seriesRange', {
              fromDate: formatDate(data.fromDate),
            }),
            { padding: '0 0 16px' },
          )
        : ''
    }
    ${changesHtml}
    ${divider('0 0 16px')}
    ${note(t('shiftDetailsChanged.note'))}
  `);

  return renderEmail({
    templateName: 'shiftDetailsChangedTemplate',
    subject: t('shiftDetailsChanged.subject', {
      shiftTitle: data.shiftTitle,
    }),
    previewText: t('shiftDetailsChanged.previewText', {
      shiftTitle: data.shiftTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('shiftDetailsChanged.footerNote', { brandName }),
  });
}
