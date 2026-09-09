import { ShiftCallOutSource } from '@repo/data';
import { Badge, Card, CardContent } from '@repo/ui';
import { CalendarFold, Clock, MailCheck, Megaphone, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { UserCard } from '@/components/user-card';
import { getFormatting } from '@/lib/formatting/formatting-server';

type ShiftInstanceCallOutEntry = {
  sentAt: string;
  recipientCount: number;
  source: ShiftCallOutSource;
  sentBy: {
    id: string;
    name: string;
    image?: string | null;
  };
};

type ShiftInstanceMetaCardProps = {
  actualEndsAt: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  callOuts?: ShiftInstanceCallOutEntry[] | null;
};

export async function ShiftInstanceMetaCard({
  actualEndsAt,
  createdAt,
  createdBy,
  callOuts,
}: ShiftInstanceMetaCardProps) {
  const t = await getTranslations('Shift');
  const { formatDate, formatDateTime, formatTime } = await getFormatting();
  const isFinished = new Date() > new Date(actualEndsAt);
  const history = callOuts ?? [];
  const hasCallOuts = history.length > 0;
  const scrollable = history.length >= 3;

  return (
    <Card className="h-full">
      <CardContent>
        <dl className="sm:space-y-4 space-y-3">
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

          {hasCallOuts ? (
            <div>
              <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                <Megaphone className="size-4 shrink-0" />{' '}
                {t('detail.urgentCallLabel')}
              </dt>
              <div
                className={`ml-6 space-y-3 ${scrollable ? 'max-h-52 overflow-y-auto pr-1' : ''}`}
              >
                <ul className="space-y-3">
                  {history.map((entry) => (
                    <li
                      key={entry.sentAt}
                      className="space-y-1.5 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                        {entry.source === ShiftCallOutSource.Automatic ? (
                          <Badge variant="secondary">
                            {t('detail.urgentCallAutomaticBadge')}
                          </Badge>
                        ) : (
                          <>
                            <span>{t('detail.urgentCallSentByPrefix')}</span>
                            <UserCard user={entry.sentBy} size="sm" hideEmail />
                          </>
                        )}
                        <span>
                          {t('detail.urgentCallSentByDate', {
                            date: `${formatDate(new Date(entry.sentAt), {
                              month: 'short',
                              day: 'numeric',
                            })}, ${formatTime(new Date(entry.sentAt))}`,
                          })}
                        </span>
                      </div>
                      <p className="flex items-center gap-2 text-sm">
                        <MailCheck className="size-4 shrink-0" />
                        {t('detail.urgentCallNotified', {
                          count: entry.recipientCount,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
