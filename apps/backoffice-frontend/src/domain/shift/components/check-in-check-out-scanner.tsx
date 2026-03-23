'use client';

import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { QRScanner } from '@/components/qr-scanner';

const extractCheckInId = (url: string) => {
  const match = url.match(
    /check-in\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return match ? match[1] : null;
};

type CheckinScannerProps = {
  organizationId: string;
};

export const CheckInCheckOutScanner = ({
  organizationId,
}: CheckinScannerProps) => {
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleScan = (data: string) => {
    setError(false);
    const checkinId = extractCheckInId(data);

    if (checkinId) {
      router.push(`/${organizationId}/check-in/${checkinId}/decide`);
    } else {
      setError(true);
      toast.error('Not a valid check-in iD. Please try again.');
    }
  };
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle />
          <AlertTitle>Invalid check-in iD</AlertTitle>
          <AlertDescription>
            Please try rescanning or rescan a different copy of QR iD.
          </AlertDescription>
        </Alert>
      )}

      <QRScanner onScan={handleScan} />
    </div>
  );
};
