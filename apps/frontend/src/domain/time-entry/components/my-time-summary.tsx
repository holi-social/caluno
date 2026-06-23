'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { formatTotalMinutes } from '../my-time-grouping';

export const MyTimeSummary = ({
  allTimeMinutes,
}: {
  allTimeMinutes: number;
}) => {
  const t = useTranslations('MyTime');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {t('summary.total')}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {formatTotalMinutes(allTimeMinutes)}
      </CardContent>
    </Card>
  );
};
