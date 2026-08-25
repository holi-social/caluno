import { describe, expect, it } from 'bun:test';
import { hasFileSelection } from './file-upload-state';

describe('hasFileSelection', () => {
  it('hides an existing server preview after clear', () => {
    expect(
      hasFileSelection({
        value: undefined,
        initialPreviewUrl: 'https://example.com/logo.png',
        initialCleared: true,
      }),
    ).toBe(false);
  });

  it('shows an existing server preview before clear', () => {
    expect(
      hasFileSelection({
        value: undefined,
        initialPreviewUrl: 'https://example.com/logo.png',
        initialCleared: false,
      }),
    ).toBe(true);
  });

  it('shows a newly uploaded value', () => {
    expect(
      hasFileSelection({
        value: 'file-id',
        initialPreviewUrl: null,
        initialCleared: false,
      }),
    ).toBe(true);
  });
});
