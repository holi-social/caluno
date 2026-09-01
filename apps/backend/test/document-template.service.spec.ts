import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractStatus,
  DocumentKind,
  SigneeType,
} from '../src/accounting/enums';
import { DocumentProfileRequirementService } from '../src/accounting/services/document-profile-requirement.service';
import { DocumentTemplateService } from '../src/accounting/services/document-template.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { createReimbursementType } from './factories/accounting.factory';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('DocumentTemplateService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: DocumentTemplateService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = new DocumentTemplateService(
      db,
      {
        capture: () => {},
      } as unknown as PostHogService,
      {
        missingOrgProfileSources: () => Promise.resolve([]),
      } as unknown as DocumentProfileRequirementService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('createDocumentTemplate', () => {
    it('creates a template with its ordered signees', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Create Template Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);

      const template = await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );

      expect(template.organizationId).toBe(organization.id);
      const signees = await service.findOrderedTemplateSignees(template.id);
      expect(signees).toHaveLength(1);
      expect(signees[0].signeeType).toBe(SigneeType.VOLUNTEER);
    });

    it('rejects a permission-holder signee with no required permission', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Invalid Signee Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);

      await expect(
        service.createDocumentTemplate(
          organization.id,
          {
            reimbursementTypeId: reimbursementType.id,
            kind: DocumentKind.CONTRACT,
            body: { header: {}, blocks: [], footer: {} },
            signees: [{ order: 0, signeeType: SigneeType.PERMISSION_HOLDER }],
          },
          editor.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('rejects an empty signee list', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `No Signees Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);

      await expect(
        service.createDocumentTemplate(
          organization.id,
          {
            reimbursementTypeId: reimbursementType.id,
            kind: DocumentKind.CONTRACT,
            body: { header: {}, blocks: [], footer: {} },
            signees: [],
          },
          editor.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('rejects a duplicate template for the same org, type and kind', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Duplicate Template Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);
      const input = {
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.CONTRACT,
        body: { header: {}, blocks: [], footer: {} },
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      };

      await service.createDocumentTemplate(organization.id, input, editor.id);

      await expect(
        service.createDocumentTemplate(organization.id, input, editor.id),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('allows a unit-level override alongside the org-wide default for the same slot', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Override Coexist Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const editor = await createUser(db);
      const input = {
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.CONTRACT,
        body: { header: {}, blocks: [], footer: {} },
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      };

      const orgDefault = await service.createDocumentTemplate(
        organization.id,
        input,
        editor.id,
      );
      const unitOverride = await service.createDocumentTemplate(
        organization.id,
        { ...input, organizationUnitId: unit.id },
        editor.id,
      );

      expect(unitOverride.id).not.toBe(orgDefault.id);
      expect(unitOverride.organizationUnitId).toBe(unit.id);
    });

    it('rejects a duplicate override for the same unit, type and kind', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Duplicate Override Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const editor = await createUser(db);
      const input = {
        organizationUnitId: unit.id,
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.CONTRACT,
        body: { header: {}, blocks: [], footer: {} },
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      };

      await service.createDocumentTemplate(organization.id, input, editor.id);

      await expect(
        service.createDocumentTemplate(organization.id, input, editor.id),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('rejects an organization unit that belongs to a different organization', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Owner Org ${crypto.randomUUID()}`,
      );
      const { organization: otherOrganization, type: otherType } =
        await createOrganizationWithType(
          db,
          `Other Org ${crypto.randomUUID()}`,
        );
      const foreignUnit = await createUnit(db, {
        organizationId: otherOrganization.id,
        typeId: otherType.id,
        name: 'foreign unit',
      });
      const editor = await createUser(db);

      await expect(
        service.createDocumentTemplate(
          organization.id,
          {
            organizationUnitId: foreignUnit.id,
            reimbursementTypeId: reimbursementType.id,
            kind: DocumentKind.CONTRACT,
            body: { header: {}, blocks: [], footer: {} },
            signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
          },
          editor.id,
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('rejects a unit-scoped template when the unit lacks an org-profile source it binds', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Org Gate Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const editor = await createUser(db);

      // The unit has no city, and the template binds org_city → the real
      // profile-requirement gate must fire. Build the service with the real
      // dependency (the shared mock always returns []).
      const gatedService = new DocumentTemplateService(
        db,
        {
          capture: () => {},
        } as unknown as PostHogService,
        new DocumentProfileRequirementService(db, {} as never),
      );

      await expect(
        gatedService.createDocumentTemplate(
          organization.id,
          {
            organizationUnitId: unit.id,
            reimbursementTypeId: reimbursementType.id,
            kind: DocumentKind.CONTRACT,
            body: {
              header: {
                orgIdentityLine: {
                  enabled: true,
                  fields: [{ value: { kind: 'bound', source: 'org_city' } }],
                },
              },
            },
            signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
          },
          editor.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });
  });

  describe('updateDocumentTemplate', () => {
    it('replaces the signee list when signees are provided', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Update Template Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);
      const template = await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );

      await service.updateDocumentTemplate(
        organization.id,
        template.id,
        {
          signees: [
            { order: 0, signeeType: SigneeType.VOLUNTEER },
            { order: 1, signeeType: SigneeType.VOLUNTEER },
          ],
        },
        editor.id,
      );

      const signees = await service.findOrderedTemplateSignees(template.id);
      expect(signees).toHaveLength(2);
    });

    it('does not retroactively change a contract already issued from the template', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Snapshot Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);
      const template = await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: { title: 'v1' }, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );
      const volunteer = await createUser(db);
      const [contract] = await db
        .insert(schema.contracts)
        .values({
          documentTemplateId: template.id,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          contractStatus: ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
          periodStart: new Date(),
          periodEnd: new Date(),
          resolvedBody: structuredClone(template.body),
        })
        .returning();

      await service.updateDocumentTemplate(
        organization.id,
        template.id,
        { body: { header: { title: 'v2' }, blocks: [], footer: {} } },
        editor.id,
      );

      const untouched = await db.query.contracts.findFirst({
        where: { id: contract.id },
      });
      expect(
        (untouched?.resolvedBody as { header: { title: string } }).header.title,
      ).toBe('v1');
    });
  });

  describe('deleteDocumentTemplate', () => {
    it('soft-deletes the template and allows recreating one for the same slot', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Delete Template Org ${crypto.randomUUID()}`,
      );
      const editor = await createUser(db);
      const input = {
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.INVOICE,
        body: { header: {}, blocks: [], footer: {} },
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      };
      const template = await service.createDocumentTemplate(
        organization.id,
        input,
        editor.id,
      );

      await service.deleteDocumentTemplate(
        organization.id,
        template.id,
        editor.id,
      );

      await expect(
        service.findDocumentTemplate(organization.id, template.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const recreated = await service.createDocumentTemplate(
        organization.id,
        input,
        editor.id,
      );
      expect(recreated.id).not.toBe(template.id);
    });
  });

  describe('findActiveTemplate', () => {
    it('throws NotFoundGraphQLError when no template is configured', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `No Template Org ${crypto.randomUUID()}`,
      );

      await expect(
        service.findActiveTemplate(
          organization.id,
          reimbursementType.id,
          DocumentKind.CONTRACT,
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('falls back to the org-wide default when the unit has no override', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Fallback Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const editor = await createUser(db);
      const orgDefault = await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );

      const resolved = await service.findActiveTemplate(
        organization.id,
        reimbursementType.id,
        DocumentKind.CONTRACT,
        unit.id,
      );

      expect(resolved.id).toBe(orgDefault.id);
    });

    it('prefers the unit override over the org-wide default', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Override Preferred Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const editor = await createUser(db);
      await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );
      const unitOverride = await service.createDocumentTemplate(
        organization.id,
        {
          organizationUnitId: unit.id,
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );

      const resolved = await service.findActiveTemplate(
        organization.id,
        reimbursementType.id,
        DocumentKind.CONTRACT,
        unit.id,
      );

      expect(resolved.id).toBe(unitOverride.id);
    });

    it("does not leak another unit's override", async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Sibling Units Org ${crypto.randomUUID()}`,
      );
      const root = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const unitA = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit-a',
        parentId: root.id,
      });
      const unitB = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit-b',
        parentId: root.id,
      });
      const editor = await createUser(db);
      const orgDefault = await service.createDocumentTemplate(
        organization.id,
        {
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );
      await service.createDocumentTemplate(
        organization.id,
        {
          organizationUnitId: unitA.id,
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
          signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
        },
        editor.id,
      );

      const resolved = await service.findActiveTemplate(
        organization.id,
        reimbursementType.id,
        DocumentKind.CONTRACT,
        unitB.id,
      );

      expect(resolved.id).toBe(orgDefault.id);
    });
  });

  describe('findOrderedTemplateSignees', () => {
    it('throws BadRequestGraphQLError for a template with no signees', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { organization } = await createOrganizationWithType(
        db,
        `Orphan Template Org ${crypto.randomUUID()}`,
      );
      // Inserted directly to bypass the service's own signee validation.
      const [template] = await db
        .insert(schema.documentTemplates)
        .values({
          organizationId: organization.id,
          reimbursementTypeId: reimbursementType.id,
          kind: DocumentKind.CONTRACT,
          body: { header: {}, blocks: [], footer: {} },
        })
        .returning();

      await expect(
        service.findOrderedTemplateSignees(template.id),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });
  });
});
