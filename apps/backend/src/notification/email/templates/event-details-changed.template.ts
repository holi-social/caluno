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

export interface EventDetailsChangedTemplateData {
  organizationUnitName: string;
  eventTitle: string;
  recipientFirstName: string;
  changes: ChangedField[];
}

function renderChange(
  change: ChangedField,
  { t }: EmailTemplateContext,
): string {
  const label = t(`eventDetailsChanged.field.${change.field}`);

  if (change.kind === 'text') {
    const text = change.text ? escapeHtml(change.text) : '';
    return `${escapeHtml(label)}: ${t('eventDetailsChanged.updated')} — ${text}`;
  }

  const previous = change.previous ? escapeHtml(change.previous) : '—';
  const current = change.current ? escapeHtml(change.current) : '—';
  return `${escapeHtml(label)}: ${previous} → ${current}`;
}

export async function eventDetailsChangedTemplate(
  data: EventDetailsChangedTemplateData,
  context: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const { t } = context;
  const firstName = escapeHtml(data.recipientFirstName);
  const brandName = emailTheme.brandName;
  const eventTitle = escapeHtml(data.eventTitle);
  const organizationUnitName = escapeHtml(data.organizationUnitName);

  const changesHtml = data.changes
    .map((change) =>
      paragraph(renderChange(change, context), { padding: '0 0 4px' }),
    )
    .join('');

  const body = card(`
    ${heading(t('eventDetailsChanged.heading'))}
    ${paragraph(
      t('eventDetailsChanged.greeting', {
        firstName,
        eventTitle,
        organizationUnitName,
      }),
      {
        padding: '0 0 16px',
      },
    )}
    ${changesHtml}
    ${divider('0 0 16px')}
    ${note(t('eventDetailsChanged.note'))}
  `);

  return renderEmail({
    templateName: 'eventDetailsChangedTemplate',
    subject: t('eventDetailsChanged.subject', {
      eventTitle: data.eventTitle,
    }),
    previewText: t('eventDetailsChanged.previewText', {
      eventTitle: data.eventTitle,
      organizationName: data.organizationUnitName,
    }),
    body,
    footerNote: t('eventDetailsChanged.footerNote', { brandName }),
  });
}
