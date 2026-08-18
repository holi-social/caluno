'use client';

import { Button } from '@repo/ui';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { shiftShareUrl } from '@/domain/shift/share';
import { copyToClipboard } from '@/lib/clipboard';

type Props = {
  shiftId: string;
  instanceId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
} & Pick<React.ComponentProps<'button'>, 'className'>;

export default function ShareLinkButton({
  shiftId,
  instanceId,
  className,
  size,
  label,
}: Props) {
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      size={size}
      onClick={() =>
        copyToClipboard(
          shiftShareUrl(shiftId, instanceId),
          tCommon('linkCopied'),
        )
      }
    >
      <Share2 className="size-4 mr-2" />
      {label ?? t('inviteForm.copyInviteLink')}
    </Button>
  );
}
