'use client';

import { Button } from '@repo/ui';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

interface Props {
  copyText: string;
  text?: string;
  toastMessage?: string;
  onClick?: () => void;
}

export function ButtonClipboard({
  copyText,
  text = 'Copy to clipboard',
  toastMessage,
  onClick,
}: Props) {
  const handleCopyToClipboard = () => {
    onClick?.();
    copyToClipboard(copyText, toastMessage);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopyToClipboard}
      className="group relative"
    >
      <p className="opacity-100 transition-opacity group-hover:opacity-0">
        {text}
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
