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
): Promise<{ subject: string; html: string }> {
  const resetUrl = escapeHtml(data.resetUrl);
  const expiresInMinutes = escapeHtml(String(data.expiresInMinutes));

  const body = card(`
    ${heading('Reset your password')}
    ${paragraph(
      `Use the button below to choose a new password for your ${emailTheme.brandName} account.`,
    )}
    ${button({ href: resetUrl, label: 'Reset password' })}
    ${paragraph(`This link expires in ${expiresInMinutes} minutes.`)}
    ${divider()}
    ${note('If you did not request this password reset, you can ignore this email.')}
  `);

  return renderEmail({
    templateName: 'passwordResetTemplate',
    subject: `Reset your ${emailTheme.brandName} password`,
    previewText: `Reset your ${emailTheme.brandName} password.`,
    body,
    footerNote: `You are receiving this because a password reset was requested for your ${emailTheme.brandName} account.`,
  });
}
