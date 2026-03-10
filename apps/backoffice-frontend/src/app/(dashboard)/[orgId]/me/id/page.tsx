import { User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getDataClient } from '@/lib/data-client';

export default async function CheckInPage() {
  const data = await getDataClient();

  const { checkInId, name } = await data.user.getMe();

  const qrValue = `${process.env.NEXT_PUBLIC_BACKOFFICE_URL}/check-in/${checkInId}`;

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">Your QR ID</h1>
          <p className="text-muted-foreground">
            This is your personal QR code to check-in to shifts
          </p>
        </div>
        <div className="px-2 py-8">
          <div className="flex justify-center">
            <div className="rounded-lg border p-8 bg-white text-black">
              <QRCodeSVG value={qrValue} size={256} level="M" />
              <h2 className="flex justify-center items-center gap-2 mt-4">
                <User className="stroke-gray-500 size-4" /> <span>{name}</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
