import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  latestPrivacyPolicyVersionFromFilenames,
  resolvePrivacyPolicyDocument,
} from './privacy-policy-files';

describe('latestPrivacyPolicyVersionFromFilenames', () => {
  it('picks the newest datenschutzhinweise-YYYY-MM-DD.pdf', () => {
    expect(
      latestPrivacyPolicyVersionFromFilenames([
        'datenschutzhinweise-2026-08-17.pdf',
        'readme.txt',
        'datenschutzhinweise-2026-08-25.pdf',
        'datenschutzhinweise-not-a-date.pdf',
      ]),
    ).toBe('2026-08-25');
  });

  it('throws when no matching privacy policy PDF exists', () => {
    expect(() => latestPrivacyPolicyVersionFromFilenames(['notes.md'])).toThrow(
      /privacy policy/i,
    );
  });
});

describe('resolvePrivacyPolicyDocument', () => {
  it('resolves version and path from the newest file in a directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'privacy-policy-'));
    writeFileSync(join(dir, 'datenschutzhinweise-2026-08-17.pdf'), 'old');
    writeFileSync(join(dir, 'datenschutzhinweise-2026-08-25.pdf'), 'new');
    mkdirSync(join(dir, 'nested'));

    const document = resolvePrivacyPolicyDocument(dir);

    expect(document.version).toBe('2026-08-25');
    expect(document.filename).toBe('datenschutzhinweise-2026-08-25.pdf');
    expect(document.path).toBe(join(dir, 'datenschutzhinweise-2026-08-25.pdf'));
  });
});
