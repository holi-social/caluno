import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StreamableFile } from '@nestjs/common';
import { LegalService } from './legal.service';

describe('LegalService', () => {
  it('streams the newest privacy policy PDF', () => {
    const dir = mkdtempSync(join(tmpdir(), 'legal-service-'));
    writeFileSync(join(dir, 'datenschutzhinweise-2026-08-17.pdf'), 'old');
    writeFileSync(join(dir, 'datenschutzhinweise-2026-08-25.pdf'), 'new');

    const file = new LegalService(dir).streamCurrentPrivacyPolicy();
    const headers = file.getHeaders();

    expect(file).toBeInstanceOf(StreamableFile);
    expect(headers.type).toBe('application/pdf');
    expect(headers.disposition).toContain('datenschutzhinweise-2026-08-25.pdf');
  });

  it('throws when the legal directory has no privacy policy PDF', () => {
    const dir = mkdtempSync(join(tmpdir(), 'legal-service-empty-'));
    mkdirSync(join(dir, 'nested'));

    expect(() => new LegalService(dir).streamCurrentPrivacyPolicy()).toThrow(
      /privacy policy/i,
    );
  });
});
