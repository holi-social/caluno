import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { Calendar, CalendarRange, MapPin, SquarePen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFormatting } from '@/lib/formatting/formatting-server';

type EventInformationCardProps = {
  orgUId: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  location: string | null | undefined;
  shiftsCount: number;
  canEdit: boolean;
};

export async function EventInformationCard({
  orgUId,
  eventId,
  startsAt,
  endsAt,
  location,
  shiftsCount,
  canEdit,
}: EventInformationCardProps) {
  const t = await getTranslations('Event.detail');
  const tForm = await getTranslations('Event.form');
  const { formatDateTime } = await getFormatting();
  const locationText = location?.trim() || null;

  return (
    <Card className="h-full gap-3">
      <CardHeader className="grid-rows-1 items-center pb-0">
        <CardTitle className="text-lg">{t('informationTitle')}</CardTitle>
        {canEdit ? (
          <CardAction className="self-center">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/${orgUId}/events/${eventId}/edit`}>
                <SquarePen />
                {t('editButton')}
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <li className="flex gap-2">
            <Calendar className="text-muted-foreground shrink-0" />
            <span>
              <span className="text-muted-foreground">
                {tForm('startsAtLabel')}:{' '}
              </span>
              {formatDateTime(new Date(startsAt))}
            </span>
          </li>
          <li className="flex gap-2">
            <Calendar className="text-muted-foreground shrink-0" />
            <span>
              <span className="text-muted-foreground">
                {tForm('endsAtLabel')}:{' '}
              </span>
              {formatDateTime(new Date(endsAt))}
            </span>
          </li>
          <li className="flex gap-2">
            <MapPin className="text-muted-foreground shrink-0" />
            <span
              className={
                locationText ? undefined : 'text-muted-foreground italic'
              }
            >
              {locationText ?? t('emptyLocation')}
            </span>
          </li>
          <li className="flex gap-2">
            <CalendarRange className="text-muted-foreground shrink-0" />
            <span>{t('shiftsCount', { count: shiftsCount })}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
