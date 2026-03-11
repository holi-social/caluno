import { Separator } from '@repo/ui';
import { QRScanner } from './qr-scanner';

export default function CheckinPage() {
  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Check-in</h1>
          <p className="text-muted-foreground">
            Scan the volunteers QR iD to check them in
          </p>
        </div>
        <div className="px-2 py-8">
          <QRScanner />
          <Separator className="my-4" />
          <h2>Search for volunteer</h2>
          TODO
        </div>
      </div>
    </div>
  );
}
