import { Injectable } from '@nestjs/common';
import { UserProfileService } from '../../requirement-profile/services/user-profile.service';
import {
  type TemplateBodyShape as BodyShape,
  type TemplateLineShape as LineShape,
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
  constructor(private readonly userProfileService: UserProfileService) {}

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
}
