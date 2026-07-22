import type { RawPublicEvent } from '@repo/data';
import { UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PublicListCard } from '@/components/public-list-card';
import { useFormatting } from '@/lib/formatting/use-formatting';

type Shift = NonNullable<RawPublicEvent>['shifts'][number];

interface EventShiftCardProps {
  shift: Shift;
}

export function EventShiftCard({ shift }: EventShiftCardProps) {
  const t = useTranslations('EventDetail');
  const { formatDate, formatTimeRange } = useFormatting();
  const firstInstance = shift.instances[0];

  const instanceSpotsLeft = shift.instances.map(
    (instance) => instance.spotsLeft,
  );
  const cappedSpotsLeft = instanceSpotsLeft.filter(
    (spots): spots is number => spots != null,
  );
  const spotsLeft = cappedSpotsLeft.reduce((sum, spots) => sum + spots, 0);
  const hasUnlimited = instanceSpotsLeft.some((spots) => spots == null);
  const fullyBooked = spotsLeft === 0 && !hasUnlimited;

  return (
    <PublicListCard
      href={`/shifts/${shift.id}`}
      eyebrow={
        firstInstance
          ? `${formatDate(new Date(firstInstance.actualStartsAt), {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })} · ${formatTimeRange(
              firstInstance.actualStartsAt,
              firstInstance.actualEndsAt,
            )}`
          : undefined
      }
      title={shift.title}
      metaIcon={UsersIcon}
      metaText={
        fullyBooked
          ? t('fullyBooked')
          : hasUnlimited
            ? t('unlimitedSpots')
            : t('spotsLeft', { n: spotsLeft })
      }
      muted={fullyBooked}
    />
  );
}
