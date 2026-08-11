import { formatRrulePattern, type ShiftVisibility } from '@repo/data';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import {
  Calendar,
  CalendarSync,
  Clock10Icon,
  FileText,
  LockKeyholeOpen,
  MapPin,
  SquarePen,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getFormatting } from '@/lib/formatting/formatting-server';
import { shiftInstanceEditPath } from '../routes';
import { getVisibilityConfig } from './shifts-table';

type ShiftInstanceInformationCardProps = {
  orgUId: string;
  shiftId: string;
  instanceId: string;
  actualStartsAt: string;
  actualEndsAt: string;
  location: string | null | undefined;
  instructions: string | null | undefined;
  rrule: string | null | undefined;
  visibility: ShiftVisibility;
  canManage: boolean;
  isInstanceInThePast: boolean;
};

export async function ShiftInstanceInformationCard({
  orgUId,
  shiftId,
  instanceId,
  actualStartsAt,
  actualEndsAt,
  location,
  instructions,
  rrule,
  visibility,
  canManage,
  isInstanceInThePast,
}: ShiftInstanceInformationCardProps) {
  const t = await getTranslations('Shift');
  const { formatDate, formatTimeRange } = await getFormatting();
  const visibilityConfig = getVisibilityConfig(t);
  const startsAt = new Date(actualStartsAt);
  const endsAt = new Date(actualEndsAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('instanceDetail.informationTitle')}</CardTitle>
        {canManage ? (
          <CardAction>
            {isInstanceInThePast ? (
              <Button variant="outline" size="sm" disabled>
                <SquarePen />
                {t('instanceDetail.editCta')}
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={shiftInstanceEditPath(orgUId, shiftId, instanceId)}>
                  <SquarePen />
                  {t('instanceDetail.editCta')}
                </Link>
              </Button>
            )}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <li className="flex gap-2">
            <Calendar className="text-muted-foreground shrink-0" />
            <span>{formatDate(startsAt)}</span>
          </li>
          <li className="flex gap-2">
            <Clock10Icon className="text-muted-foreground shrink-0" />
            <span>{formatTimeRange(startsAt, endsAt)}</span>
          </li>
          <li className="flex gap-2">
            <CalendarSync className="text-muted-foreground shrink-0" />
            <span>{formatRrulePattern(rrule)}</span>
          </li>
          <li className="flex gap-2 items-center">
            <LockKeyholeOpen className="text-muted-foreground shrink-0" />
            <Badge variant={visibilityConfig[visibility].variant}>
              {visibilityConfig[visibility].label}
            </Badge>
          </li>
          {location ? (
            <li className="flex gap-2">
              <MapPin className="text-muted-foreground shrink-0" />
              <span>{location}</span>
            </li>
          ) : null}
          {instructions ? (
            <li className="flex gap-2">
              <FileText className="text-muted-foreground shrink-0" />
              <p className="whitespace-pre-wrap break-words min-w-0">
                {instructions}
              </p>
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}
