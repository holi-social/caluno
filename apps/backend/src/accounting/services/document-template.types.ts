/**
 * Structural view of a document template's body, shared by
 * DocumentRenderingService (renders it into a PDF) and
 * DocumentProfileRequirementService (checks which profile-bound sources it
 * needs). Kept in one place so the two stay in sync.
 */
export interface TemplateFieldShape {
  id: string;
  value:
    | { kind: 'bound'; source: string }
    | { kind: 'manual-template'; value?: string };
}

export interface TemplateLineShape {
  id: string;
  text: string;
  fields: TemplateFieldShape[];
  enabled?: boolean;
}

export interface TemplateBlockShape {
  id: string;
  kind?: string;
  title?: string;
  enabled?: boolean;
  lines?: TemplateLineShape[];
  /** Note blocks carry a single line instead of an array. */
  line?: TemplateLineShape;
  /** Table blocks. */
  columns?: string[];
}

export interface TemplateBodyShape {
  header?: {
    titleLines?: string[];
    metaLines?: TemplateLineShape[];
    orgIdentityLine?: TemplateLineShape;
  };
  blocks?: TemplateBlockShape[];
  footer?: {
    closingLine?: TemplateLineShape;
    showSignatures?: boolean;
  };
}

/**
 * Maps a template field's bound `source` to the `user_profiles.data` key it
 * reads from. Shared by the renderer (fills the field in) and the sign gate /
 * `missingProfileFields` resolver (checks the volunteer has supplied it).
 */
export const PROFILE_SOURCE_TO_PROFILE_KEY: Record<string, string> = {
  volunteer_iban: 'iban',
  volunteer_bic: 'bic',
  volunteer_address: 'address',
  volunteer_dob: 'birth-date',
};
