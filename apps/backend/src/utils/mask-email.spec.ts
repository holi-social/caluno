import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('masks local part and top-level domain', () => {
    expect(maskEmail('john.doe@example.com')).toBe('jo***@***.com');
  });

  it('masks short local parts', () => {
    expect(maskEmail('a@b.co')).toBe('a***@***.co');
  });

  it('handles missing domain', () => {
    expect(maskEmail('no-at-sign')).toBe('***');
  });

  it('handles domain without dot', () => {
    expect(maskEmail('user@localhost')).toBe('us***@***');
  });
});
