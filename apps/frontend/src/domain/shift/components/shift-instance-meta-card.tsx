import { ShiftCallOutSource } from '@repo/data';
import { Badge, Card, CardContent } from '@repo/ui';
import { CalendarFold, Clock, MailCheck, Megaphone, User } from 'lucide-react';
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
  lastCallOut?: {
    sentAt: string;
    recipientCount: number;
    source: ShiftCallOutSource;
    sentBy: {
      id: string;
      name: string;
      image?: string | null;
    };
  } | null;
};

export async function ShiftInstanceMetaCard({
  actualEndsAt,
  createdAt,
  createdBy,
  lastCallOut,
}: ShiftInstanceMetaCardProps) {
  const t = await getTranslations('Shift');
  const { formatDate, formatDateTime, formatTime } = await getFormatting();
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

          {lastCallOut ? (
            <div>
              <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                <Megaphone className="size-4 shrink-0" />{' '}
                {t('detail.urgentCallLabel')}
              </dt>
              <dd className="ml-6 space-y-2">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                  {lastCallOut.source === ShiftCallOutSource.Automatic ? (
                    <Badge variant="secondary">
                      {t('detail.urgentCallAutomaticBadge')}
                    </Badge>
                  ) : (
                    <>
                      <span>{t('detail.urgentCallSentByPrefix')}</span>
                      <UserCard user={lastCallOut.sentBy} size="sm" hideEmail />
                    </>
                  )}
                  <span>
                    {t('detail.urgentCallSentByDate', {
                      date: `${formatDate(new Date(lastCallOut.sentAt), {
                        month: 'short',
                        day: 'numeric',
                      })}, ${formatTime(new Date(lastCallOut.sentAt))}`,
                    })}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm">
                  <MailCheck className="size-4 shrink-0" />
                  {t('detail.urgentCallNotified', {
                    count: lastCallOut.recipientCount,
                  })}
                </p>
              </dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
