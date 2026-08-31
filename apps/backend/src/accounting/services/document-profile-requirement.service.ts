import { Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { Inject } from '@nestjs/common';
import { UserProfileService } from '../../requirement-profile/services/user-profile.service';

/**
 * Sources a document template reads from the volunteer's profile. These are
 * the fields the volunteer must have filled in before the document can be
 * signed and rendered, otherwise the contract/invoice comes out with "—" gaps
 * (the renderer maps these DataSourceKeys onto `user_profiles.data`).
 */
const PROFILE_SOURCE_TO_PROFILE_KEY: Record<string, string> = {
  volunteer_iban: 'iban',
  volunteer_bic: 'bic',
  volunteer_address: 'address',
  volunteer_dob: 'birth-date',
};

/** Structural view of the template body — mirrors document-rendering.service. */
interface FieldShape {
  value: { kind: 'bound'; source: string } | { kind: 'manual-template' };
}

interface LineShape {
  enabled?: boolean;
  fields?: FieldShape[];
}

interface BlockShape {
  enabled?: boolean;
  lines?: LineShape[];
  line?: LineShape;
}

interface BodyShape {
  header?: { orgIdentityLine?: LineShape; metaLines?: LineShape[] };
  blocks?: BlockShape[];
  footer?: { closingLine?: LineShape };
}

/**
 * Computes which of the profile-required data sources a document's template
 * actually uses (on enabled lines) and whether the volunteer's profile is
 * missing any of them. Shared by the sign gate (Block: don't let a document be
 * signed with gaps) and the GraphQL `missingProfileFields` resolver that lets
 * the volunteer card surface a "complete your profile" call to action.
 */
@Injectable()
export class DocumentProfileRequirementService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userProfileService: UserProfileService,
  ) {}

  /** The profile-required DataSourceKeys the template binds on enabled lines. */
  requiredProfileSources(body: unknown): string[] {
    const template = (body ?? {}) as BodyShape;
    const sources = new Set<string>();

    const collectLine = (line: LineShape | undefined) => {
      if (!line || line.enabled === false) return;
      for (const field of line.fields ?? []) {
        if (
          field.value.kind === 'bound' &&
          field.value.source in PROFILE_SOURCE_TO_PROFILE_KEY
        ) {
          sources.add(field.value.source);
        }
      }
    };

    collectLine(template.header?.orgIdentityLine);
    for (const metaLine of template.header?.metaLines ?? []) {
      collectLine(metaLine);
    }
    for (const block of template.blocks ?? []) {
      if (block.enabled === false) continue;
      collectLine(block.line);
      for (const line of block.lines ?? []) collectLine(line);
    }
    collectLine(template.footer?.closingLine);

    return [...sources];
  }

  /**
   * The profile-required source keys the document needs that the volunteer has
   * not yet supplied. Empty when the document is ready to be signed.
   */
  async missingProfileSources(
    volunteerId: string,
    templateBody: unknown,
  ): Promise<string[]> {
    const required = this.requiredProfileSources(templateBody);
    if (required.length === 0) return [];    const profile = await this.userProfileService.findByUserId(volunteerId);
    const data = (profile?.data ?? {}) as Record<string, unknown>;

    return required.filter((source) => {
      const key = PROFILE_SOURCE_TO_PROFILE_KEY[source];
      const value = data[key];
      return typeof value !== 'string' || value.trim() === '';
    });
  }
}
