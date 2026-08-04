import { FieldType } from '@repo/data';

export type SystemProfileField = {
  key: string;
  labelKey: string;
  type: FieldType;
  required: boolean;
};

/**
 * The system profile fields, in canonical (form-builder) order.
 * `labelKey` is a key under the `RequirementForm.fieldForm` namespace.
 * Single source of truth shared by the form builder and the profile section.
 */
export const SYSTEM_PROFILE_FIELDS: readonly SystemProfileField[] = [
  { key: 'name', labelKey: 'firstName', type: FieldType.Name, required: true },
  {
    key: 'lastname',
    labelKey: 'lastName',
    type: FieldType.Lastname,
    required: true,
  },
  {
    key: 'preferred-name',
    labelKey: 'preferredName',
    type: FieldType.Text,
    required: false,
  },
  { key: 'email', labelKey: 'email', type: FieldType.Email, required: true },
  { key: 'phone', labelKey: 'phone', type: FieldType.Phone, required: false },
  {
    key: 'address',
    labelKey: 'address',
    type: FieldType.Text,
    required: false,
  },
  { key: 'zip', labelKey: 'zipCode', type: FieldType.Zip, required: false },
  { key: 'city', labelKey: 'city', type: FieldType.Text, required: false },
  {
    key: 'birth-date',
    labelKey: 'birthDate',
    type: FieldType.Date,
    required: false,
  },
  { key: 'gender', labelKey: 'gender', type: FieldType.Text, required: false },
  { key: 'iban', labelKey: 'iban', type: FieldType.Iban, required: true },
];
