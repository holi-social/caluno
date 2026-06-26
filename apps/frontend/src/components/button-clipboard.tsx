'use client';

import { Button } from '@repo/ui';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { copyToClipboard } from '@/lib/clipboard';

interface Props {
  copyText: string;
  text?: string;
  toastMessage?: string;
  onClick?: () => void;
}

export function ButtonClipboard({
  copyText,
  text,
  toastMessage,
  onClick,
}: Props) {
  const t = useTranslations('Common');
  const displayText = text ?? t('copyToClipboard');

  const handleCopyToClipboard = () => {
    onClick?.();
    copyToClipboard(copyText, toastMessage ?? t('linkCopied'));
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopyToClipboard}
      className="group relative"
    >
      <p className="opacity-100 transition-opacity group-hover:opacity-0">
        {displayText}
      </p>

      <div className="absolute left-4 right-4 flex gap-4 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="w-full truncate">{copyText}</p>

        <div className="flex items-center justify-center">
          <Copy />
        </div>
      </div>
    </Button>
  );
}
