import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { maskEmail } from '../../utils';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid?: string;
}

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

interface ScalewayConfig {
  secretKey: string;
  projectId: string;
  region: string;
  fromEmail: string;
  fromName?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  fromEmail: string;
  fromName?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly scaleway: ScalewayConfig | null = null;
  private readonly smtp: SmtpConfig | null = null;
  private transporter: nodemailer.Transporter | null = null;
  /**
   * Dev fallback: when no mailer is configured, emails are logged instead of
   * sent. The full HTML (recipient names, OTPs, reset links) is only included
   * when explicitly enabled outside production/staging.
   */
  private readonly logEmailContent =
    process.env.EMAIL_LOG_CONTENT === '1' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'staging';

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('TEM_SECRET_KEY');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<string>('SMTP_PORT');

    if (secretKey) {
      this.scaleway = {
        secretKey,
        projectId: this.configService.getOrThrow<string>('PROJECT_ID'),
        region: this.configService.getOrThrow<string>('TEM_REGION'),
        fromEmail: 'noreply@caluno.org',
        fromName: 'Caluno',
      };
    } else if (smtpHost && smtpPort) {
      this.smtp = {
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        fromEmail: 'noreply@caluno.org',
        fromName: 'Caluno',
      };
      this.transporter = nodemailer.createTransport({
        host: this.smtp.host,
        port: this.smtp.port,
        ignoreTLS: true,
      });
    }
  }

  async send(options: EmailSendOptions): Promise<void> {
    const maskedTo = maskEmail(options.to);

    if (this.transporter && this.smtp) {
      try {
        await this.transporter.sendMail({
          from: `"${this.smtp.fromName}" <${this.smtp.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text ?? this.htmlToText(options.html),
          attachments: options.attachments?.map((attachment) => ({
            ...attachment,
            contentDisposition: attachment.cid ? 'inline' : 'attachment',
          })),
        });
        this.logger.debug(`Email sent to ${maskedTo} via SMTP`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send email to ${maskedTo} via SMTP: ${message}`,
        );
        throw new Error('Failed to send email');
      }
    }

    if (!this.scaleway) {
      const attachmentNote = options.attachments?.length
        ? ` attachments=${options.attachments.map((a) => a.filename).join(',')}`
        : '';
      this.logger.log(
        `[Email:LOG] to=${maskedTo} subject="${options.subject}"${attachmentNote}${
          this.logEmailContent
            ? `\n${options.html}`
            : ' (content omitted; set EMAIL_LOG_CONTENT=1 outside production to log)'
        }`,
      );
      return;
    }

    const url = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${this.scaleway.region}/emails`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.scaleway.secretKey,
        },
        body: JSON.stringify({
          from: {
            email: this.scaleway.fromEmail,
            name: this.scaleway.fromName,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          html: options.html,
          text: options.text ?? this.htmlToText(options.html),
          project_id: this.scaleway.projectId,
          attachments: options.attachments?.map((attachment) => ({
            name: attachment.filename,
            type: attachment.contentType,
            content: attachment.content.toString('base64'),
            ...(attachment.cid ? { content_id: attachment.cid } : {}),
          })),
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${maskedTo}: ${message}`);
      throw new Error('Failed to send email');
    }

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `Scaleway Transactional Email responded ${response.status} for ${maskedTo}: ${body}`,
      );
      throw new Error('Failed to send email');
    }

    this.logger.debug(`Email sent to ${maskedTo}`);
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
