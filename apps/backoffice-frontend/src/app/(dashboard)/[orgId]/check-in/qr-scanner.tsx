'use client';

import { Alert, AlertDescription, AlertTitle } from '@repo/ui';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface QRScannerProps {
  onScan?: (data: string) => void;
}

type ErrorMessage = {
  title: string;
  description: string;
};

export function QRScanner({ onScan }: QRScannerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<ErrorMessage>();
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const firstCode = detectedCodes[0];
    if (firstCode?.rawValue && !isPaused) {
      console.log('QR Code detected:', firstCode.rawValue);
      onScan?.(firstCode.rawValue);

      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 500);

      setIsPaused(true);
    }
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      if (
        err.name === 'NotAllowedError' ||
        err.message.includes('Permission')
      ) {
        setError({
          title: 'Camera access required',
          description:
            'Please allow camera access in your browser settings to scan QR codes.',
        });
        return;
      }
      if (err.name === 'NotFoundError' || err.message.includes('No camera')) {
        setError({
          title: 'No camera found',
          description:
            'No camera was detected on this device. Please connect a camera or use a device with a built-in camera.',
        });
        return;
      }
    }
    setError({
      title: 'Camera error',
      description: 'Unable to access the camera. Please try again.',
    });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{error.title}</AlertTitle>
        <AlertDescription>{error.description}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div
        className={`relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 ${
          showSuccessFlash
            ? 'ring-8 ring-green-500 ring-opacity-75 scale-105'
            : ''
        }`}
      >
        <Scanner
          onScan={handleScan}
          onError={handleError}
          paused={isPaused}
          constraints={{ facingMode: 'environment', aspectRatio: 1 }}
          sound={true}
          components={{ onOff: true, finder: true, torch: true, zoom: true }}
          formats={['qr_code', 'rm_qr_code', 'micro_qr_code']}
        />
      </div>

      {isPaused && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            QR code scanned! Use the toggle above to resume scanning.
          </p>
        </div>
      )}
    </div>
  );
}
