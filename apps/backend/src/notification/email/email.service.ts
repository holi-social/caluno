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
    const secretKey = this.configService.get<string>('TEMP_SECRET_KEY');

    if (!secretKey) {
      this.scaleway = null;
      return;
    }

    this.scaleway = {
      secretKey,
      projectId: this.configService.getOrThrow<string>('PROJECT_ID'),
      region: this.configService.getOrThrow<string>('TEMP_REGION'),
      fromEmail: 'noreply@holi.social', // TODO: Change this to the actual email address
      fromName: 'Clippy', // TODO: Change this to the actual name
    };
  }

  async send(options: EmailSendOptions): Promise<void> {
    if (!this.scaleway) {
      this.logger.log(
        `[Email:LOG] to=${options.to} subject="${options.subject}"\n${options.html}`,
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
          `Scaleway TEM responded ${response.status} for ${options.to}: ${body}`,
        );
        return;
      }

      this.logger.debug(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
