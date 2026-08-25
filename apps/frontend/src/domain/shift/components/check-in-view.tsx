'use client';

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { Hash, ScanQrCode, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { CheckInQrScanner } from './check-in-qr-scanner';
import { ManualCheckInDialog } from './manual-check-in-dialog';

interface CheckInViewProps {
  checkInId: string;
  qrValue: string;
  name: string;
  canCheckIn: boolean;
}

export function CheckInView({
  checkInId,
  qrValue,
  name,
  canCheckIn,
}: CheckInViewProps) {
  const [tab, setTab] = useState<'qr' | 'scanner'>('qr');
  const [manualCheckinOpen, setManualCheckinOpen] = useState(false);
  const t = useTranslations('Navigation');
  const tCheckIn = useTranslations('CheckIn');

  const easyReadCheckinId = checkInId.match(/.{1,4}/g)?.join('-') ?? checkInId;

  const qrCard = (
    <div className="px-2 py-8">
      <div className="flex justify-center">
        <div className="rounded-lg border p-8 pb-4 bg-white text-black space-y-2">
          <QRCodeSVG value={qrValue} size={256} level="M" />
          <h2 className="flex justify-center items-center gap-2 pt-2">
            <User className="stroke-gray-500 size-4" />
            <span className="text-xl">{name}</span>
          </h2>
          <h2 className="flex justify-center items-center gap-2">
            <Hash className="stroke-gray-500 size-4" />
            <span className="text-xl font-mono">{easyReadCheckinId}</span>
          </h2>
        </div>
      </div>
    </div>
  );

  if (!canCheckIn) {
    return (
      <div className="max-w-2xl">
        <p className="text-muted-foreground">{t('qrIdDescription')}</p>
        {qrCard}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'qr' | 'scanner')}
      >
        <TabsList>
          <TabsTrigger value="qr">{tCheckIn('myQrCodeTab')}</TabsTrigger>
          <TabsTrigger value="scanner">{tCheckIn('qrScannerTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="qr">
          <p className="text-muted-foreground">{t('qrIdDescription')}</p>
          {qrCard}
          <Button
            type="button"
            className="w-full"
            onClick={() => setTab('scanner')}
          >
            <ScanQrCode /> {tCheckIn('scanACode')}
          </Button>
        </TabsContent>
        <TabsContent value="scanner">
          <div className="px-2 py-8">
            <CheckInQrScanner
              onManualCheckin={() => setManualCheckinOpen(true)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ManualCheckInDialog
        open={manualCheckinOpen}
        onOpenChange={setManualCheckinOpen}
      />
    </div>
  );
}
