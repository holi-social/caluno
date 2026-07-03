export type DataSourceKey =
  | 'volunteer_first_name'
  | 'volunteer_last_name'
  | 'org_name'
  | 'org_address'
  | 'org_legal_rep'
  | 'pauschalen_type'
  | 'hourly_rate'
  | 'period_start'
  | 'period_end'
  | 'total_hours'
  | 'total_amount'
  | 'generated_date'
  | 'document_number'
  | 'volunteer_iban'
  | 'volunteer_address'
  | 'volunteer_dob'
  | 'volunteer_tax_id';

export const ALWAYS_AVAILABLE_SOURCES: DataSourceKey[] = [
  'volunteer_first_name',
  'volunteer_last_name',
  'org_name',
  'org_address',
  'org_legal_rep',
  'pauschalen_type',
  'hourly_rate',
  'period_start',
  'period_end',
  'total_hours',
  'total_amount',
  'generated_date',
  'document_number',
];

export const PROFILE_REQUIRED_SOURCES: DataSourceKey[] = [
  'volunteer_iban',
  'volunteer_address',
  'volunteer_dob',
  'volunteer_tax_id',
];

export interface PlacedField {
  id: string;
  /** null means unbound */
  dataSource: DataSourceKey | null;
  /** whether the org's requirement profile is missing this source */
  profileGap: boolean;
}
