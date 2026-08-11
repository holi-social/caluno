import { Badge, Card, CardContent } from '@repo/ui';
import { CalendarFold, Clock, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { getFormatting } from '@/lib/formatting/formatting-server';

type ShiftInstanceMetaCardProps = {
  actualEndsAt: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
};

export async function ShiftInstanceMetaCard({
  actualEndsAt,
  createdAt,
  createdBy,
}: ShiftInstanceMetaCardProps) {
  const t = await getTranslations('Shift');
  const { formatDateTime } = await getFormatting();
  const isFinished = new Date() > new Date(actualEndsAt);

  return (
    <Card className="h-full">
      <CardContent>
        <dl className="space-y-4">
          <div>
            <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
              <CalendarFold className="size-4 shrink-0" />{' '}
              {t('detail.statusLabel')}
            </dt>
            <dd className="ml-6">
              {isFinished ? (
                <Badge variant="secondary">{t('status.finished')}</Badge>
              ) : (
                <Badge variant="success">{t('status.active')}</Badge>
              )}
            </dd>
          </div>

          {createdBy ? (
            <div>
              <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                <User className="size-4 shrink-0" />{' '}
                {t('detail.createdByLabel')}
              </dt>
              <dd className="ml-6">
                <UserCard user={createdBy} size="sm" hideEmail />
              </dd>
            </div>
          ) : null}

          <div>
            <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
              <Clock className="size-4 shrink-0" /> {t('detail.createdLabel')}
            </dt>
            <dd className="ml-6">{formatDateTime(new Date(createdAt))}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
