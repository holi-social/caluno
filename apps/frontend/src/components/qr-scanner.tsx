'use client';

import { Alert, AlertDescription, AlertTitle, Button } from '@repo/ui';
import { type IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { AlertCircle, ScanQrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface QRScannerProps {
  onScan?: (data: string) => void;
}

type ErrorMessage = {
  title: string;
  description: string;
};

const highlightCodeOnCanvas = (
  detectedCodes: IDetectedBarcode[],
  ctx: CanvasRenderingContext2D,
) => {
  detectedCodes.forEach((detectedCode) => {
    const { cornerPoints } = detectedCode;

    if (cornerPoints && cornerPoints.length > 0) {
      // Draw polygon connecting corner points (matches rotation)
      ctx.strokeStyle = '#fdfd80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      cornerPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Draw corner points
      ctx.fillStyle = '#fdc700';
      cornerPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });
};

export function QRScanner({ onScan }: QRScannerProps) {
  const t = useTranslations('QRScanner');
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<ErrorMessage>();
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const firstCode = detectedCodes[0];
    if (firstCode?.rawValue && !isPaused) {
      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 500);

      setIsPaused(true);

      onScan?.(firstCode.rawValue);
    }
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      if (
        err.name === 'NotAllowedError' ||
        err.message.includes('Permission')
      ) {
        setError({
          title: t('error.noPermission.title'),
          description: t('error.noPermission.description'),
        });
        return;
      }
      if (err.name === 'NotFoundError' || err.message.includes('No camera')) {
        setError({
          title: t('error.noCamera.title'),
          description: t('error.noCamera.description'),
        });
        return;
      }
    }
    setError({
      title: t('error.generic.title'),
      description: t('error.generic.description'),
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
    <div>
      <div
        className={`relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 ${
          showSuccessFlash
            ? 'ring-4 ring-green-500 ring-opacity-75 scale-102'
            : ''
        }`}
      >
        <Scanner
          onScan={handleScan}
          onError={handleError}
          paused={isPaused}
          constraints={{ facingMode: 'environment', aspectRatio: 1 }}
          sound={true}
          components={{
            onOff: true,
            finder: true,
            torch: true,
            zoom: true,
            tracker: highlightCodeOnCanvas,
          }}
          formats={['qr_code', 'rm_qr_code', 'micro_qr_code']}
        />
      </div>

      {isPaused && (
        <div className="mt-4 text-center">
          <Button onClick={() => setIsPaused(false)}>
            <ScanQrCode /> {t('rescan')}
          </Button>
        </div>
      )}
    </div>
  );
}
