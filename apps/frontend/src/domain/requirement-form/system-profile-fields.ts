import { FieldType } from '@repo/data';

export type SystemProfileField = {
  key: string;
  labelKey: string;
  type: FieldType;
  required: boolean;
};

export const SYSTEM_PROFILE_FIELDS: readonly SystemProfileField[] = [
  {
    key: 'preferred-name',
    labelKey: 'preferredName',
    type: FieldType.Text,
    required: false,
  },
  { key: 'name', labelKey: 'firstName', type: FieldType.Name, required: true },
  {
    key: 'lastname',
    labelKey: 'lastName',
    type: FieldType.Lastname,
    required: true,
  },
  { key: 'gender', labelKey: 'gender', type: FieldType.Text, required: false },

  { key: 'email', labelKey: 'email', type: FieldType.Email, required: true },
  { key: 'phone', labelKey: 'phone', type: FieldType.Phone, required: false },
  {
    key: 'birth-date',
    labelKey: 'birthDate',
    type: FieldType.Date,
    required: false,
  },
  {
    key: 'address',
    labelKey: 'address',
    type: FieldType.Text,
    required: false,
  },
  { key: 'zip', labelKey: 'zipCode', type: FieldType.Zip, required: false },
  { key: 'city', labelKey: 'city', type: FieldType.Text, required: false },
  { key: 'iban', labelKey: 'iban', type: FieldType.Iban, required: true },
  { key: 'bic', labelKey: 'bic', type: FieldType.Text, required: true },
  {
    key: 'tax-id',
    labelKey: 'taxId',
    type: FieldType.Text,
    required: false,
  },
];
