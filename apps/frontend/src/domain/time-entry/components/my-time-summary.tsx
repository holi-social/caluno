import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatTotalMinutes } from '../my-time-grouping';

export const MyTimeSummary = ({
  allTimeMinutes,
}: {
  allTimeMinutes: number;
}) => {
  const t = useTranslations('MyTime');
  return (
    <div className="rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        {t('summary.total')}
      </div>
      <p className="mt-2 text-4xl font-bold text-primary tabular-nums">
        {formatTotalMinutes(allTimeMinutes)}
      </p>
    </div>
  );
};
