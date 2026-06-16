import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ScalewayConfig {
  secretKey: string;
  projectId: string;
  region: string;
  fromEmail: string;
  fromName?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly scaleway: ScalewayConfig | null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('TEM_SECRET_KEY');

    if (!secretKey) {
      this.scaleway = null;
      return;
    }

    this.scaleway = {
      secretKey,
      projectId: this.configService.getOrThrow<string>('PROJECT_ID'),
      region: this.configService.getOrThrow<string>('TEM_REGION'),
      fromEmail: 'noreply@holi.social', // TODO: Change this to the actual email address
      fromName: 'Clippy', // TODO: Change this to the actual name
    };
  }

  async send(options: EmailSendOptions): Promise<void> {
    const maskedTo = this.maskEmail(options.to);

    if (!this.scaleway) {
      this.logger.log(
        `[Email:LOG] to=${maskedTo} subject="${options.subject}"\n${options.html}`,
      );
      return;
    }

    const url = `https://api.scaleway.com/transactional-email/v1alpha1/regions/${this.scaleway.region}/emails`;

    try {
      const response = await fetch(url, {
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
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `Scaleway Transactional Email responded ${response.status} for ${maskedTo}: ${body}`,
        );
        return;
      }

      this.logger.debug(`Email sent to ${maskedTo}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${maskedTo}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) {
      return '***';
    }
    const maskedLocal =
      local.length <= 2 ? `${local[0] ?? ''}***` : `${local.slice(0, 2)}***`;

    const dotIndex = domain.lastIndexOf('.');
    const maskedDomain =
      dotIndex === -1 ? '***' : `***${domain.slice(dotIndex)}`;

    return `${maskedLocal}@${maskedDomain}`;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
