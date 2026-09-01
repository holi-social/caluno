import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { UserProfileService } from '../../requirement-profile/services/user-profile.service';
import {
  type TemplateBodyShape as BodyShape,
  type TemplateLineShape as LineShape,
  ORG_SOURCE_TO_ORG_COLUMN,
  PROFILE_SOURCE_TO_PROFILE_KEY,
} from './document-template.types';

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
    if (required.length === 0) return [];
    const profile = await this.userProfileService.findByUserId(volunteerId);
    const data = (profile?.data ?? {}) as Record<string, unknown>;

    return required.filter((source) => {
      const key = PROFILE_SOURCE_TO_PROFILE_KEY[source];
      const value = data[key];
      return typeof value !== 'string' || value.trim() === '';
    });
  }

  private requiredOrgSources(body: unknown): string[] {
    const template = (body ?? {}) as BodyShape;
    const sources = new Set<string>();

    const collectLine = (line: LineShape | undefined) => {
      if (!line || line.enabled === false) return;
      for (const field of line.fields ?? []) {
        if (
          field.value.kind === 'bound' &&
          field.value.source in ORG_SOURCE_TO_ORG_COLUMN
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
   * The org-column source keys a document's template needs that the org has
   * not yet supplied (e.g. org_city/org_address). Empty when the org profile is
   * complete enough to create/send the document. `name` is always present, so
   * only the genuinely optional org profile fields show up here.
   */
  async missingOrgProfileSources(
    organizationId: string,
    templateBody: unknown,
  ): Promise<string[]> {
    const required = this.requiredOrgSources(templateBody);
    if (required.length === 0) return [];
    const org = await this.db.query.organizations.findFirst({
      where: { id: organizationId },
    });
    if (!org) return [];

    return required.filter((source) => {
      const column = ORG_SOURCE_TO_ORG_COLUMN[source];
      if (column === 'name') return false; // always present
      const value = (org as unknown as Record<string, unknown>)[column];
      return typeof value !== 'string' || value.trim() === '';
    });
  }
}
