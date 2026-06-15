import mjml2html from 'mjml';
import { emailTheme } from './theme';

const { colors, fontStack, brandName, supportEmail } = emailTheme;

export interface RenderEmailOptions {
  /** Used only to label MJML compilation errors. */
  templateName: string;
  subject: string;
  /** Inbox preview snippet shown next to the subject. */
  previewText: string;
  /** MJML body content (typically one or more `<mj-section>`s, e.g. a `card`). */
  body: string;
  /** Optional extra line in the footer explaining why the email was sent. */
  footerNote?: string;
}

/**
 * Wraps template-specific body content in the shared email shell (head config,
 * branded wordmark header, footer) and compiles it to HTML.
 *
 * @throws if MJML reports compilation errors.
 */
export async function renderEmail(
  options: RenderEmailOptions,
): Promise<{ subject: string; html: string }> {
  const { templateName, subject, previewText, body, footerNote } = options;

  const { html, errors } = await mjml2html(`
    <mjml>
      <mj-head>
        <mj-preview>${previewText}</mj-preview>
        <mj-attributes>
          <mj-all font-family="${fontStack}" />
          <mj-text font-size="16px" line-height="1.6" color="${colors.ink}" />
        </mj-attributes>
        <mj-style>
          a { color: ${colors.greenDark}; }
        </mj-style>
      </mj-head>
      <mj-body background-color="${colors.bg}" width="600px">
        <mj-section padding="32px 0 16px">
          <mj-column>
            <mj-text align="center" font-size="20px" font-weight="700" letter-spacing="-0.01em" color="${colors.green}" padding="0">
              ${brandName}
            </mj-text>
          </mj-column>
        </mj-section>

        ${body}

        <mj-section padding="24px 32px 40px">
          <mj-column>
            <mj-text align="center" font-size="13px" line-height="1.6" color="${colors.muted}" padding="0">
              Need a hand? Reach us at <a href="mailto:${supportEmail}">${supportEmail}</a>.${footerNote ? `<br />${footerNote}` : ''}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `);

  if (errors.length > 0) {
    throw new Error(
      `MJML compilation errors in ${templateName}: ${errors.map((error) => error.message).join(', ')}`,
    );
  }

  return { subject, html };
}
