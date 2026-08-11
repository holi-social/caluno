import { slugify } from './slug.util';

describe('slugify', () => {
  it('lowercases ASCII titles and replaces spaces with hyphens', () => {
    const result = slugify('Hello World');
    expect(result.startsWith('hello-world-')).toBe(true);
  });

  it('removes diacritics from latin characters', () => {
    const result = slugify('YÜMI');
    expect(result.startsWith('yumi-')).toBe(true);
  });

  it('replaces sequences of non-alphanumeric characters with a single hyphen', () => {
    const result = slugify('  A!@#B$$ C  ');
    expect(result.startsWith('a-b-c-')).toBe(true);
  });

  it('trims leading and trailing non-alphanumeric characters', () => {
    const result = slugify('!!!Event Name!!!');
    expect(result.startsWith('event-name-')).toBe(true);
  });

  it('falls back to a generic prefix when the sanitized name is empty', () => {
    const result = slugify('中文字');
    expect(result.startsWith('slug-')).toBe(true);
  });

  it('produces different suffixes for consecutive calls', () => {
    const a = slugify('Same Title');
    const b = slugify('Same Title');
    expect(a).not.toBe(b);
  });
});
