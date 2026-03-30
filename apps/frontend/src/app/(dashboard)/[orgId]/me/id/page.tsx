import { Hash, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getDataClient } from '@/lib/data-client';

export default async function CheckInPage() {
  const data = await getDataClient();

  const { checkInId, name } = await data.user.getMe();
  const easyReadCheckinId = checkInId.match(/.{1,4}/g)?.join('-') ?? checkInId;

  const qrValue = `${process.env.NEXT_PUBLIC_BACKOFFICE_URL}/check-in/${checkInId}`;

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">My QR iD</h1>
          <p className="text-muted-foreground">
            This is your personal QR code to check-in to shifts
          </p>
        </div>
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
      </div>
    </div>
  );
}
