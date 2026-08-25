'use client';

import { Button } from '@repo/ui';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface CopyShareLinkButtonProps {
  shareToken: string;
}

export function CopyShareLinkButton({ shareToken }: CopyShareLinkButtonProps) {
  const t = useTranslations('RequirementForm.builder');
  const tActions = useTranslations('RequirementForm.actions');

  async function handleCopyShareLink() {
    const url = `${window.location.origin}/f/${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success(tActions('linkCopied'), { description: url });
  }

  return (
    <Button variant="outline" onClick={handleCopyShareLink}>
      <Copy className="mr-2 h-4 w-4" />
      {t('copyShareLink')}
    </Button>
  );
}
