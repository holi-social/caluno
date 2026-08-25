import { describe, expect, it } from 'bun:test';
import {
  getAcceptForPurpose,
  isMimeTypeAllowedForPurpose,
} from './allowed-mime-types';

describe('allowed-mime-types', () => {
  it('rejects PDF for image upload purposes', () => {
    expect(isMimeTypeAllowedForPurpose('org_logo', 'application/pdf')).toBe(
      false,
    );
    expect(isMimeTypeAllowedForPurpose('event_image', 'application/pdf')).toBe(
      false,
    );
    expect(
      isMimeTypeAllowedForPurpose('profile_picture', 'application/pdf'),
    ).toBe(false);
  });

  it('allows images for image upload purposes', () => {
    expect(isMimeTypeAllowedForPurpose('shift_image', 'image/png')).toBe(true);
  });

  it('allows any file type for document upload purposes', () => {
    expect(
      isMimeTypeAllowedForPurpose('requirement_document', 'application/pdf'),
    ).toBe(true);
    expect(
      isMimeTypeAllowedForPurpose(
        'form_document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(true);
  });

  it('does not restrict the file picker for document upload purposes', () => {
    expect(getAcceptForPurpose('requirement_document')).toBeUndefined();
    expect(getAcceptForPurpose('form_document')).toBeUndefined();
  });
});
