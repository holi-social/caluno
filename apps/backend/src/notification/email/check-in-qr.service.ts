import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { checkInAdminUrl } from './templates/shared';

export interface CheckInQrAttachments {
  png: Buffer;
  pdf: Buffer;
}

const QR_PNG_SIZE_PX = 512;
const QR_PDF_IMAGE_SIZE_PT = 300;

@Injectable()
export class CheckInQrService {
  async generateAttachments(
    checkInId: string,
    volunteerName: string,
    caption: string,
  ): Promise<CheckInQrAttachments> {
    const url = checkInAdminUrl(checkInId);
    const [png, pdf] = await Promise.all([
      this.generatePng(url),
      this.generatePdf(url, volunteerName, caption),
    ]);
    return { png, pdf };
  }

  attachmentFilenames(volunteerName: string): { png: string; pdf: string } {
    const slug = this.sanitizeFilenamePart(volunteerName);
    return {
      png: `Check-in-QR-${slug}.png`,
      pdf: `Check-in-QR-${slug}.pdf`,
    };
  }

  private async generatePng(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      type: 'png',
      width: QR_PNG_SIZE_PX,
      margin: 2,
    });
  }

  private async generatePdf(
    url: string,
    volunteerName: string,
    caption: string,
  ): Promise<Buffer> {
    const qrPng = await this.generatePng(url);

    return new Promise<Buffer>((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(volunteerName, { align: 'center' });
      pdf.moveDown(2);

      const imageX = (pdf.page.width - QR_PDF_IMAGE_SIZE_PT) / 2;
      pdf.image(qrPng, imageX, pdf.y, {
        width: QR_PDF_IMAGE_SIZE_PT,
        height: QR_PDF_IMAGE_SIZE_PT,
      });
      pdf.y += QR_PDF_IMAGE_SIZE_PT;
      pdf.moveDown(1.5);

      pdf.fontSize(11).font('Helvetica').text(caption, { align: 'center' });

      pdf.end();
    });
  }

  /** Strips diacritics (NFKD-decompose, drop combining marks) so e.g. "José" becomes "Jose-" before the ASCII-only slugify. */
  private sanitizeFilenamePart(value: string): string {
    const COMBINING_DIACRITICS = /[̀-ͯ]/g;
    return (
      value
        .normalize('NFKD')
        .replace(COMBINING_DIACRITICS, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'volunteer'
    );
  }
}
