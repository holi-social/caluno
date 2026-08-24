import { Badge, Card, CardContent } from '@repo/ui';
import { CalendarFold, Clock, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { getFormatting } from '@/lib/formatting/formatting-server';

type EventMetaCardProps = {
  endsAt: string;
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
};

export async function EventMetaCard({
  endsAt,
  createdAt,
  organizer,
}: EventMetaCardProps) {
  const t = await getTranslations('Event.detail');
  const { formatDateTime } = await getFormatting();
  const isFinished = new Date() > new Date(endsAt);

  return (
    <Card className="h-full">
      <CardContent>
        <dl className="space-y-4">
          <div>
            <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
              <CalendarFold className="size-4 shrink-0" />
              {t('statusLabel')}
            </dt>
            <dd className="ml-6">
              {isFinished ? (
                <Badge variant="secondary">{t('status.finished')}</Badge>
              ) : (
                <Badge variant="success">{t('status.active')}</Badge>
              )}
            </dd>
          </div>

          {organizer ? (
            <div>
              <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                <User className="size-4 shrink-0" />
                {t('createdByLabel')}
              </dt>
              <dd className="ml-6">
                <UserCard user={organizer} size="sm" hideEmail />
              </dd>
            </div>
          ) : null}

          <div>
            <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
              <Clock className="size-4 shrink-0" />
              {t('createdLabel')}
            </dt>
            <dd className="ml-6">{formatDateTime(new Date(createdAt))}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
