import { CheckInQrService } from './check-in-qr.service';

describe('CheckInQrService', () => {
  const originalWebUrl = process.env.WEB_URL;
  let service: CheckInQrService;

  beforeEach(() => {
    process.env.WEB_URL = 'http://localhost:3000';
    service = new CheckInQrService();
  });

  afterEach(() => {
    if (originalWebUrl === undefined) {
      delete process.env.WEB_URL;
    } else {
      process.env.WEB_URL = originalWebUrl;
    }
  });

  it('generates a PNG and a one-page PDF for a check-in id', async () => {
    const { png, pdf } = await service.generateAttachments(
      'checkin1abc23',
      'Sam Smith',
      'Show this code at check-in.',
    );

    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('builds a recognisable, sanitized PDF attachment filename', () => {
    expect(service.attachmentFilename('Sam Smith')).toBe(
      'Check-in-QR-Sam-Smith.pdf',
    );
    expect(service.attachmentFilename('José Müller')).toBe(
      'Check-in-QR-Jose-Muller.pdf',
    );
  });

  it('falls back to a generic name when nothing sanitizable remains', () => {
    expect(service.attachmentFilename('*** ///')).toBe(
      'Check-in-QR-volunteer.pdf',
    );
  });
});
