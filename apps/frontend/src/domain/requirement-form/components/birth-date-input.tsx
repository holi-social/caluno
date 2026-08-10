'use client';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from '@repo/ui/base/input-otp';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  formValueFromOtpDigits,
  otpDigitsFromStoredDate,
} from './birth-date-segments';

type BirthDateInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
};

export function BirthDateInput({
  id,
  value,
  onChange,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
}: BirthDateInputProps) {
  const separator = useLocale() === 'de' ? '.' : '/';
  const [digits, setDigits] = useState(() => otpDigitsFromStoredDate(value));
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setDigits(otpDigitsFromStoredDate(value));
    lastEmittedRef.current = value;
  }, [value]);

  return (
    <InputOTP
      id={id}
      maxLength={8}
      pattern={REGEXP_ONLY_DIGITS}
      value={digits}
      aria-invalid={ariaInvalid}
      aria-labelledby={ariaLabelledBy}
      onChange={(next) => {
        setDigits(next);
        const nextValue = formValueFromOtpDigits(next);
        lastEmittedRef.current = nextValue;
        onChange(nextValue);
      }}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} aria-invalid={ariaInvalid} />
        <InputOTPSlot index={1} aria-invalid={ariaInvalid} />
      </InputOTPGroup>
      <InputOTPSeparator>{separator}</InputOTPSeparator>
      <InputOTPGroup>
        <InputOTPSlot index={2} aria-invalid={ariaInvalid} />
        <InputOTPSlot index={3} aria-invalid={ariaInvalid} />
      </InputOTPGroup>
      <InputOTPSeparator>{separator}</InputOTPSeparator>
      <InputOTPGroup>
        <InputOTPSlot index={4} aria-invalid={ariaInvalid} />
        <InputOTPSlot index={5} aria-invalid={ariaInvalid} />
        <InputOTPSlot index={6} aria-invalid={ariaInvalid} />
        <InputOTPSlot index={7} aria-invalid={ariaInvalid} />
      </InputOTPGroup>
    </InputOTP>
  );
}
