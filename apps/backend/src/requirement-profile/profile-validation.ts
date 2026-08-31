import { BadRequestGraphQLError } from '../graphql/errors';

/** A human label for a system key, used in validation error messages. */
export const formatSystemKeyLabel = (systemKey: string): string => {
  switch (systemKey) {
    case 'name':
      return 'First name';
    case 'lastname':
      return 'Last name';
    case 'preferred-name':
      return 'Preferred name';
    case 'birth-date':
      return 'Birth date';
    case 'iban':
      return 'IBAN';
    case 'bic':
      return 'BIC';
    default:
      return systemKey;
  }
};

/**
 * Per-key validation for the profile system fields, shared by the form
 * submission path and the `updateMyUserProfile` mutation (the volunteer's
 * identity/banking edit form). Modelled on the frontend validator so a profile
 * value accepted client-side is accepted here too, and vice versa.
 */
export const validateSystemKeyValue = (
  value: string,
  systemKey: string,
  label: string,
  minAge: number | null,
): void => {
  switch (systemKey) {
    case 'name':
    case 'lastname':
    case 'preferred-name':
    case 'city':
      if (value.length > 100)
        throw new BadRequestGraphQLError(
          `"${label}": must be 100 characters or fewer`,
        );
      if (!/^[\p{L}\p{M}'\- ]+$/u.test(value))
        throw new BadRequestGraphQLError(
          `"${label}": contains invalid characters`,
        );
      break;
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254)
        throw new BadRequestGraphQLError(
          `"${label}": must be a valid email address`,
        );
      break;
    case 'phone':
      if (!/^\+?[\d\s\-().]{7,20}$/.test(value))
        throw new BadRequestGraphQLError(
          `"${label}": must be a valid phone number`,
        );
      break;
    case 'address':
      if (value.length > 200)
        throw new BadRequestGraphQLError(
          `"${label}": must be 200 characters or fewer`,
        );
      break;
    case 'zip':
      if (!/^[A-Z0-9\- ]{3,10}$/i.test(value))
        throw new BadRequestGraphQLError(
          `"${label}": must be a valid postal code`,
        );
      break;
    case 'gender':
      if (value.length > 50)
        throw new BadRequestGraphQLError(
          `"${label}": must be 50 characters or fewer`,
        );
      break;
    case 'birth-date':
      if (minAge !== null && minAge !== undefined) {
        const birth = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (
          today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() &&
            today.getDate() < birth.getDate())
        ) {
          age--;
        }
        if (age < minAge)
          throw new BadRequestGraphQLError(
            `You must be at least ${minAge} years old`,
          );
      }
      break;
    case 'iban': {
      const iban = value.replace(/\s+/g, '').toUpperCase();
      if (iban.length > 34 || !isValidIban(iban))
        throw new BadRequestGraphQLError(
          `"${label}": must be a valid IBAN`,
        );
      break;
    }
    case 'bic': {
      const bic = value.replace(/\s+/g, '').toUpperCase();
      if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic))
        throw new BadRequestGraphQLError(
          `"${label}": must be a valid BIC`,
        );
      break;
    }
  }
};

/** Full IBAN mod-97 checksum — matches the frontend validator. */
const isValidIban = (iban: string): boolean => {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = [...rearranged]
    .map((ch) => (/[A-Z]/.test(ch) ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join('');
  let remainder = '';
  for (const digit of numeric) {
    remainder = `${remainder}${digit}`.replace(/^0+/, '');
    const n = Number.parseInt(remainder, 10);
    if (Number.isNaN(n)) return false;
    remainder = (n % 97).toString();
  }
  return remainder === '1';
};
