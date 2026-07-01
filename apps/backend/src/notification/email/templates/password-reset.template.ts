import type { EmailTemplateContext } from '../../../i18n/email-translate';
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
} from './shared';

export interface PasswordResetTemplateData {
  resetUrl: string;
  expiresInMinutes: number;
}

export async function passwordResetTemplate(
  data: PasswordResetTemplateData,
  { t }: EmailTemplateContext,
): Promise<{ subject: string; html: string }> {
  const resetUrl = escapeHtml(data.resetUrl);
  const expiresInMinutes = data.expiresInMinutes;
  const brandName = emailTheme.brandName;

  const body = card(`
    ${heading(t('passwordReset.heading'))}
    ${paragraph(t('passwordReset.intro', { brandName }))}
    ${button({ href: resetUrl, label: t('passwordReset.buttonLabel') })}
    ${paragraph(t('passwordReset.expiry', { minutes: expiresInMinutes }))}
    ${divider()}
    ${note(t('passwordReset.note'))}
  `);

  return renderEmail({
    templateName: 'passwordResetTemplate',
    subject: t('passwordReset.subject', { brandName }),
    previewText: t('passwordReset.previewText', { brandName }),
    body,
    footerNote: t('passwordReset.footerNote', { brandName }),
  });
}
