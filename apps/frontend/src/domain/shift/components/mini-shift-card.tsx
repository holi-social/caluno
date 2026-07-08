import { Clock } from 'lucide-react';
import { useFormatting } from '@/lib/formatting/use-formatting';

type MiniShiftCardProps = {
  title: string;
  actualStartsAt: string;
  actualEndsAt: string;
};

export function MiniShiftCard({
  title,
  actualStartsAt,
  actualEndsAt,
}: MiniShiftCardProps) {
  const { formatTimeRange } = useFormatting();

  return (
    <div className="p-1">
      <dt className="truncate font-bold text-left">{title}</dt>
      <dl className="text-xs truncate flex items-center gap-1">
        <Clock className="size-3 shrink-0" />{' '}
        {formatTimeRange(actualStartsAt, actualEndsAt)}
      </dl>
    </div>
  );
}
