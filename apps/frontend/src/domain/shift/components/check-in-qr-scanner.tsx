'use client';

import { Alert, AlertDescription, AlertTitle, Button } from '@repo/ui';
import { AlertCircle, ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { QRScanner } from '@/components/qr-scanner';
import { extractCheckInPath } from '@/domain/shift/routes';
import { useRouter } from '@/i18n/navigation';

interface CheckInQrScannerProps {
  onManualCheckin: () => void;
}

export function CheckInQrScanner({ onManualCheckin }: CheckInQrScannerProps) {
  const [error, setError] = useState(false);
  const router = useRouter();
  const t = useTranslations('Shift');
  const tCheckIn = useTranslations('CheckIn');

  const handleScan = (data: string) => {
    setError(false);
    const path = extractCheckInPath(data);

    if (path) {
      router.push(path);
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

      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full"
        onClick={onManualCheckin}
      >
        <ClipboardList /> {tCheckIn('manualCheckin')}
      </Button>
    </div>
  );
}
