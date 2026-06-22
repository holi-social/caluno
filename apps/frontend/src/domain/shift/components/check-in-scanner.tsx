'use client';

import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { QRScanner } from '@/components/qr-scanner';
import { useRouter } from '@/i18n/navigation';

const extractCheckInId = (url: string) => {
  const match = url.match(/check-in\/([a-z0-9]{12})/i);
  return match ? match[1] : null;
};

type CheckinScannerProps = {
  organizationUnitId: string;
};

export const CheckInScanner = ({ organizationUnitId }: CheckinScannerProps) => {
  const [error, setError] = useState(false);
  const router = useRouter();
  const t = useTranslations('Shift');

  const handleScan = (data: string) => {
    setError(false);
    const checkinId = extractCheckInId(data);

    if (checkinId) {
      router.push(`/admin/${organizationUnitId}/check-in/${checkinId}/decide`);
    } else {
      setError(true);
      toast.error(t('scanner.invalidToast'));
    }
  };
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertTitle>{t('scanner.title')}</AlertTitle>
          <AlertDescription>{t('scanner.description')}</AlertDescription>
        </Alert>
      )}

      <QRScanner onScan={handleScan} />
    </div>
  );
};
