import { describe, expect, it } from 'bun:test';
import { createTranslator } from 'next-intl';
import messages from '../../../../messages/en.json';

const t = createTranslator({
  locale: 'en',
  messages,
  namespace: 'Event.card',
});

describe('Event.card i18n messages', () => {
  it('shows "No shifts" with zero shifts and zero forms', () => {
    expect(t('pill', { shiftsCount: 0, formsCount: 0 })).toBe('No shifts');
  });

  it('pluralizes a single shift', () => {
    expect(t('pill', { shiftsCount: 1, formsCount: 0 })).toBe('1 shift');
  });

  it('shows the shift count with no form suffix when there are no forms', () => {
    expect(t('pill', { shiftsCount: 12, formsCount: 0 })).toBe('12 shifts');
  });

  it('appends the form count when forms are attached', () => {
    expect(t('pill', { shiftsCount: 10, formsCount: 2 })).toBe(
      '10 shifts · 2 forms',
    );
  });

  it('appends a singular form count', () => {
    expect(t('pill', { shiftsCount: 10, formsCount: 1 })).toBe(
      '10 shifts · 1 form',
    );
  });

  it('appends the form count even with no shifts', () => {
    expect(t('pill', { shiftsCount: 0, formsCount: 2 })).toBe(
      'No shifts · 2 forms',
    );
  });

  it('pluralizes the volunteers count', () => {
    expect(t('volunteers', { count: 1 })).toBe('1 volunteer signed up');
    expect(t('volunteers', { count: 42 })).toBe('42 volunteers signed up');
  });

  it('has a view button label', () => {
    expect(t('viewButton')).toBe('View event');
  });
});
