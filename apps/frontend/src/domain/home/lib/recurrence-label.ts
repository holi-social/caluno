import { useTranslations } from 'next-intl';

export function useRecurrenceLabel() {
  const t = useTranslations('VolunteerHome');

  return (rrule: string | null | undefined): string | null => {
    if (!rrule) return null;

    if (rrule.includes('FREQ=WEEKLY')) {
      return t('weekly');
    }

    return null;
  };
}
