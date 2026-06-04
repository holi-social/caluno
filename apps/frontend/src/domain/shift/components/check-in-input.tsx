'use client';

import { Button } from '@repo/ui';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from '@repo/ui/base/input-otp';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type CheckInInputProps = {
  organizationUnitId: string;
};

export const CheckInInput = ({ organizationUnitId }: CheckInInputProps) => {
  const [value, setValue] = useState('');
  const router = useRouter();

  const handleCheckIn = () =>
    router.push(
      `/admin/${organizationUnitId}/check-in/${value.toLowerCase()}/decide`,
    );

  return (
    <div className="flex gap-2">
      <InputOTP
        maxLength={12}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        containerClassName="flex-wrap"
        value={value}
        onChange={(value) => setValue(value)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
          <InputOTPSlot index={6} />
          <InputOTPSlot index={7} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={8} />
          <InputOTPSlot index={9} />
          <InputOTPSlot index={10} />
          <InputOTPSlot index={11} />
        </InputOTPGroup>
      </InputOTP>
      <Button onClick={handleCheckIn} disabled={value.length < 12}>
        Check in <LogIn />
      </Button>
    </div>
  );
};
