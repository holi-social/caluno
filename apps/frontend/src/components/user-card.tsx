import type { User } from '@repo/data';
import { Avatar, AvatarFallback, AvatarImage, cn } from '@repo/ui';
import { FilePenLine } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  type PauschalenType,
  TYPE_COLOR,
} from '@/domain/accounting/components/doc-type-header';
import { MOCK_PAUSCHALE_LIMITS } from '@/domain/accounting/mock-rates';

export type UserCardPauschale = {
  type: PauschalenType;
  amountLeft: number;
  amountProjected: number;
};

type UserCardProps = {
  user: Pick<User, 'name' | 'image'> & { email?: string | null };
  size?: 'sm' | 'lg' | 'default';
  hideEmail?: boolean;
  pauschale?: UserCardPauschale | null;
};

const getInitials = (name?: string): string => {
  if (!name) return '?';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
};

export const UserCard = ({
  user,
  size = 'default',
  hideEmail = false,
  pauschale,
}: UserCardProps) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="flex gap-2 min-w-0">
      <Avatar size={size} className="bg-muted">
        <AvatarImage src={user.image ?? ''} alt="" />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="overflow-hidden">
        <div className="font-medium text-left text-sm truncate">
          {user.name}
        </div>
        {!hideEmail && (
          <div className="text-xs text-left text-muted-foreground truncate">
            {user.email}
          </div>
        )}
      </div>
    </div>
    {pauschale && <PauschaleStatus pauschale={pauschale} />}
  </div>
);

const PauschaleStatus = ({ pauschale }: { pauschale: UserCardPauschale }) => {
  const t = useTranslations('UserCard');
  const format = useFormatter();
  const { type, amountLeft, amountProjected } = pauschale;

  const isOverLimit = amountProjected > MOCK_PAUSCHALE_LIMITS[type];
  const amountClassName = cn('font-medium', isOverLimit && 'text-destructive');
  const amountStyle = isOverLimit ? undefined : { color: TYPE_COLOR[type] };

  const formatAmount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  return (
    <div className="flex w-fit items-start gap-1 rounded-lg border border-border px-2 py-1 text-xs text-left">
      <FilePenLine className="size-4 shrink-0" aria-hidden="true" />
      <span>
        {t('entitled')} ·{' '}
        <span className={amountClassName} style={amountStyle}>
          {t('amountLeft', { amount: formatAmount(amountLeft) })}
        </span>{' '}
        →{' '}
        <span className={amountClassName} style={amountStyle}>
          {t('amountProjected', { amount: formatAmount(amountProjected) })}
        </span>
      </span>
    </div>
  );
};
