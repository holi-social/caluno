'use client';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from '@repo/ui/base/input-otp';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  formValueFromOtpDigits,
  otpDigitsFromStoredDate,
  partsFromDateFormat,
} from './birth-date-segments';

type BirthDateInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export function BirthDateInput({
  id,
  value,
  onChange,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: BirthDateInputProps) {
  const t = useTranslations('RequirementForm.volunteerForm');
  const format = t('birthDateFormat');
  const { placeholders, separator } = partsFromDateFormat(format);
  const formatHintId = `${id}-date-format`;
  const describedBy = [ariaDescribedBy, formatHintId].filter(Boolean).join(' ');
  const [digits, setDigits] = useState(() => otpDigitsFromStoredDate(value));
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setDigits(otpDigitsFromStoredDate(value));
    lastEmittedRef.current = value;
  }, [value]);

  const slot = (index: number) => (
    <InputOTPSlot
      index={index}
      aria-invalid={ariaInvalid}
      placeholder={placeholders[index]}
    />
  );

  return (
    <>
      <InputOTP
        id={id}
        maxLength={8}
        pattern={REGEXP_ONLY_DIGITS}
        value={digits}
        aria-invalid={ariaInvalid}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy || undefined}
        onChange={(next) => {
          setDigits(next);
          const nextValue = formValueFromOtpDigits(next);
          lastEmittedRef.current = nextValue;
          onChange(nextValue);
        }}
      >
        <InputOTPGroup>
          {slot(0)}
          {slot(1)}
        </InputOTPGroup>
        <InputOTPSeparator>{separator}</InputOTPSeparator>
        <InputOTPGroup>
          {slot(2)}
          {slot(3)}
        </InputOTPGroup>
        <InputOTPSeparator>{separator}</InputOTPSeparator>
        <InputOTPGroup>
          {slot(4)}
          {slot(5)}
          {slot(6)}
          {slot(7)}
        </InputOTPGroup>
      </InputOTP>
      <span id={formatHintId} className="sr-only">
        {format}
      </span>
    </>
  );
}
