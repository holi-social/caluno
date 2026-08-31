import 'reflect-metadata';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  setDefaultTimeout,
} from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq } from 'drizzle-orm';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  SigneeType,
} from '../src/accounting/enums';
import type { Database } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { NotificationEvent } from '../src/notification/notification-events';
import type { DocumentAwaitingSignaturePayload } from '../src/notification/payloads/document-awaiting-signature.payload';
import type { DocumentDeclinedByOrgPayload } from '../src/notification/payloads/document-declined-by-org.payload';
import {
  createReimbursementType,
  createTwoStepTemplate,
} from './factories/accounting.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  assignRoleToMembership,
  createPermission,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import { createShift } from './factories/shift.factory';
import { createShiftInstance } from './factories/shift-instance.factory';
import { createUser } from './factories/user.factory';
import { applyBunAuthMocks, setAuthMockUserId } from './helpers/auth-mocks';
import {
  graphqlRequest,
  graphqlRequestRequiringData,
} from './helpers/graphql-request';
import { getGraphqlTestContext } from './helpers/graphql-test-context';

applyBunAuthMocks(mock.module);
setDefaultTimeout(30_000);

// ─── GraphQL documents ────────────────────────────────────────────────────────

const CREATE_CONTRACT = `
  mutation CreateContract($input: CreateContractInput!) {
    createContract(input: $input) {
      id
      contractStatus
      volunteer { id }
      statusChanges { type occurredAt actorUser { id name } }
    }
  }
`;

const CREATE_INVOICE = `
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceStatus
      totalAmountCents
      totalHours
      volunteer { id }
      statusChanges { type occurredAt actorUser { id name } }
    }
  }
`;

const SIGN_CONTRACT = `
  mutation SignContract($contractId: ID!) {
    signContract(contractId: $contractId) {
      id
      contractStatus
      signatures { signeeType signedAt signedByUser { id name } }
    }
  }
`;

const DECLINE_CONTRACT = `
  mutation DeclineContract($contractId: ID!, $reason: String!) {
    declineContract(contractId: $contractId, reason: $reason) {
      id
      contractStatus
      declineReason
      declinedAt
      declinedAtSigneeType
      declinedByUser { id name }
      statusChanges { type }
    }
  }
`;

const SIGN_INVOICE = `
  mutation SignInvoice($invoiceId: ID!) {
    signInvoice(invoiceId: $invoiceId) {
      id
      invoiceStatus
      signatures { signeeType signedAt signedByUser { id name } }
    }
  }
`;

const DECLINE_INVOICE = `
  mutation DeclineInvoice($invoiceId: ID!, $reason: String!) {
    declineInvoice(invoiceId: $invoiceId, reason: $reason) {
      id
      invoiceStatus
      declineReason
      declinedAtSigneeType
      declinedByUser { id }
    }
  }
`;

const MY_CONTRACTS = `
  query MyContracts {
    myContracts {
      id
      contractStatus
      volunteer { id }
    }
  }
`;

const MY_INVOICES = `
  query MyInvoices {
    myInvoices {
      id
      invoiceStatus
      volunteer { id }
    }
  }
`;

const MY_DOCUMENTS = `
  query MyDocuments {
    myDocuments {
      membershipId
      organizationUnitId
      organizationName
      contracts { id contractStatus }
      invoices { id invoiceStatus }
    }
  }
`;

const MY_DOCUMENT_SUMMARY = `
  query MyDocumentSummary {
    myDocumentSummary {
      total
      pending
    }
  }
`;

const CONTRACTS = `
  query Contracts {
    contracts {
      id
      contractStatus
      declineReason
      declinedByUser { id }
      volunteer { id }
    }
  }
`;

const CONTRACT_DETAIL = `
  query ContractDetail($id: ID!) {
    contract(id: $id) {
      id
      contractStatus
      downloadUrl
      signatures { order signeeType signedAt signedByUser { id name } }
      statusChanges { type occurredAt }
    }
  }
`;

const INVOICE_DETAIL = `
  query InvoiceDetail($id: ID!) {
    invoice(id: $id) {
      id
      invoiceStatus
      totalHours
      totalAmountCents
      downloadUrl
      invoiceTimeEntries { id }
      signatures { order signeeType signedAt signedByUser { id name } }
      statusChanges { type }
    }
  }
`;

// ─── Setup helpers ────────────────────────────────────────────────────────────

type FlowOrg = Awaited<ReturnType<typeof setupFlowOrg>>;

/** A complete org: admin with the signing permission, a volunteer member, and contract + invoice templates. */
const setupFlowOrg = async (db: Database) => {
  const reimbursementType = await createReimbursementType(db);
  const { organization, type } = await createOrganizationWithType(
    db,
    `Docs Flow Org ${crypto.randomUUID()}`,
  );
  const root = await createUnit(db, {
    organizationId: organization.id,
    typeId: type.id,
    name: 'root',
  });
  // Accounting operations are gated on the org's accountingEnabled flag.
  await db
    .update(schema.organizations)
    .set({ accountingEnabled: true })
    .where(eq(schema.organizations.id, organization.id));

  // The real seeded permission: resolvers check it by key (e.g. viewing a
  // document as a non-volunteer) and templates reference it for the second
  // signee, so the admin must hold exactly this one.
  const permission =
    (await db.query.permissions.findFirst({
      where: { key: 'accounting:manage' },
    })) ?? (await createPermission(db, { key: 'accounting:manage' }));
  const role = await createRole(db, { organizationId: organization.id });
  await grantPermissionToRole(db, {
    roleId: role.id,
    permissionId: permission.id,
  });

  const admin = await createUser(db);
  const adminMembership = await addMembership(db, admin.id, root.id);
  await assignRoleToMembership(db, {
    membershipId: adminMembership.id,
    roleId: role.id,
  });

  const volunteer = await createUser(db);
  await addMembership(db, volunteer.id, root.id);

  await createTwoStepTemplate(db, {
    organizationId: organization.id,
    reimbursementTypeId: reimbursementType.id,
    kind: DocumentKind.CONTRACT,
    requiredPermissionId: permission.id,
    signeeTypes: [SigneeType.VOLUNTEER, SigneeType.PERMISSION_HOLDER],
  });
  await createTwoStepTemplate(db, {
    organizationId: organization.id,
    reimbursementTypeId: reimbursementType.id,
    kind: DocumentKind.INVOICE,
    requiredPermissionId: permission.id,
    signeeTypes: [SigneeType.VOLUNTEER, SigneeType.PERMISSION_HOLDER],
  });

  return {
    organizationId: organization.id,
    organizationUnitId: root.id,
    adminId: admin.id,
    volunteerId: volunteer.id,
    reimbursementTypeId: reimbursementType.id,
  };
};

/** A completed, unclaimed, paid time entry — the raw material for an invoice. */
const createCompletedTimeEntry = async (
  db: Database,
  args: {
    organizationUnitId: string;
    volunteerId: string;
    reimbursementTypeId: string;
  },
) => {
  const shift = await createShift(db, {
    organizationUnitId: args.organizationUnitId,
    title: `Paid shift ${crypto.randomUUID()}`,
    startsAt: new Date('2026-07-01T09:00:00.000Z'),
    endsAt: new Date('2026-07-01T10:00:00.000Z'),
  });
  const instance = await createShiftInstance(db, shift.id);
  const [timeEntry] = await db
    .insert(schema.timeEntries)
    .values({
      shiftInstanceId: instance.id,
      organizationUnitId: args.organizationUnitId,
      volunteerId: args.volunteerId,
      reimbursementTypeId: args.reimbursementTypeId,
      startedAt: new Date('2026-07-01T09:00:00.000Z'),
      endedAt: new Date('2026-07-01T13:00:00.000Z'), // 4 hours
      isPaid: true,
    })
    .returning();
  if (!timeEntry) throw new Error('Failed to create time entry');
  return timeEntry;
};

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('documents flow — admin + volunteer', () => {
  let app: INestApplication;
  let db: Database;
  let org: FlowOrg;
  let orgHeader: Record<string, string>;

  let emitter: EventEmitter2;
  const awaitingSignatureEvents: DocumentAwaitingSignaturePayload[] = [];
  const declinedByOrgEvents: DocumentDeclinedByOrgPayload[] = [];
  const onAwaitingSignature = (payload: DocumentAwaitingSignaturePayload) => {
    awaitingSignatureEvents.push(payload);
  };
  const onDeclinedByOrg = (payload: DocumentDeclinedByOrgPayload) => {
    declinedByOrgEvents.push(payload);
  };

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;

    org = await setupFlowOrg(db);
    orgHeader = { 'x-organization-unit-id': org.organizationUnitId };

    emitter = app.get(EventEmitter2);
    emitter.on(
      NotificationEvent.DOCUMENT_AWAITING_SIGNATURE,
      onAwaitingSignature,
    );
    emitter.on(NotificationEvent.DOCUMENT_DECLINED_BY_ORG, onDeclinedByOrg);
  });

  beforeEach(() => {
    awaitingSignatureEvents.length = 0;
    declinedByOrgEvents.length = 0;
  });

  const createContractAsAdmin = async () => {
    setAuthMockUserId(org.adminId);
    return graphqlRequestRequiringData<{
      createContract: { id: string; contractStatus: string };
    }>(
      app,
      {
        query: CREATE_CONTRACT,
        variables: {
          input: {
            organizationUnitId: org.organizationUnitId,
            reimbursementTypeId: org.reimbursementTypeId,
            volunteerId: org.volunteerId,
            periodStart: '2026-01-01T00:00:00.000Z',
            periodEnd: '2027-01-01T00:00:00.000Z',
          },
        },
        headers: orgHeader,
      },
      'createContract',
    );
  };

  describe('contract lifecycle', () => {
    it('goes AWAITING_VOLUNTEER_SIGNATURE → AWAITING_NGO_SIGNATURE → ACTIVE with a full paper trail, and emails the volunteer once', async () => {
      const { createContract } = await createContractAsAdmin();
      expect(createContract.contractStatus).toBe(
        ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
      );

      // The volunteer is told exactly once: when the document needs their signature.
      expect(awaitingSignatureEvents).toHaveLength(1);
      expect(awaitingSignatureEvents[0].volunteerUserId).toBe(org.volunteerId);
      expect(awaitingSignatureEvents[0].documentKind).toBe(
        DocumentKind.CONTRACT,
      );

      // The volunteer sees it on their membership page.
      setAuthMockUserId(org.volunteerId);
      const mine = await graphqlRequestRequiringData<{
        myContracts: Array<{ id: string; contractStatus: string }>;
      }>(app, { query: MY_CONTRACTS, headers: orgHeader }, 'myContracts');
      expect(mine.myContracts).toHaveLength(1);
      expect(mine.myContracts[0]).toMatchObject({
        id: createContract.id,
        contractStatus: ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
      });

      // Volunteer signs — one tap, no extra step.
      const signed = await graphqlRequestRequiringData<{
        signContract: { id: string; contractStatus: string };
      }>(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: orgHeader,
        },
        'signContract',
      );
      expect(signed.signContract.contractStatus).toBe(
        ContractStatus.AWAITING_NGO_SIGNATURE,
      );

      // Admin countersigns — the document is fully signed.
      setAuthMockUserId(org.adminId);
      const countersigned = await graphqlRequestRequiringData<{
        signContract: { id: string; contractStatus: string };
      }>(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: orgHeader,
        },
        'signContract',
      );
      expect(countersigned.signContract.contractStatus).toBe(
        ContractStatus.ACTIVE,
      );

      // Full paper trail: both signatures and the four status changes.
      const detail = await graphqlRequestRequiringData<{
        contract: {
          id: string;
          contractStatus: string;
          signatures: Array<{
            order: number;
            signeeType: string;
            signedAt: string | null;
            signedByUser: { id: string } | null;
          }>;
          statusChanges: Array<{ type: string }>;
        };
      }>(
        app,
        {
          query: CONTRACT_DETAIL,
          variables: { id: createContract.id },
          headers: orgHeader,
        },
        'contract',
      );
      expect(detail.contract.contractStatus).toBe(ContractStatus.ACTIVE);
      expect(detail.contract.signatures).toHaveLength(2);
      expect(detail.contract.signatures.map((s) => s.signedByUser?.id)).toEqual(
        [org.volunteerId, org.adminId],
      );
      expect(detail.contract.statusChanges.map((s) => s.type)).toEqual([
        DocumentStatusChange.CREATED,
        DocumentStatusChange.SIGNED,
        DocumentStatusChange.COUNTERSIGNED,
        DocumentStatusChange.ACTIVATED,
      ]);
    });

    it('records a volunteer decline with the reason and attributes it to the volunteer, without emailing them', async () => {
      const { createContract } = await createContractAsAdmin();

      setAuthMockUserId(org.volunteerId);
      const reason = 'Ich habe den Zeitraum übersehen';
      const declined = await graphqlRequestRequiringData<{
        declineContract: {
          id: string;
          contractStatus: string;
          declineReason: string;
          declinedAtSigneeType: string | null;
          declinedByUser: { id: string } | null;
        };
      }>(
        app,
        {
          query: DECLINE_CONTRACT,
          variables: { contractId: createContract.id, reason },
          headers: orgHeader,
        },
        'declineContract',
      );
      expect(declined.declineContract.contractStatus).toBe(
        ContractStatus.DECLINED,
      );
      expect(declined.declineContract.declineReason).toBe(reason);
      expect(declined.declineContract.declinedAtSigneeType).toBe(
        SigneeType.VOLUNTEER,
      );
      expect(declined.declineContract.declinedByUser?.id).toBe(org.volunteerId);

      // Their own decline is their doing — no email.
      expect(declinedByOrgEvents).toHaveLength(0);

      // The org's dashboard reads Declined, attributed to the volunteer, with the reason.
      setAuthMockUserId(org.adminId);
      const orgView = await graphqlRequestRequiringData<{
        contracts: Array<{
          id: string;
          contractStatus: string;
          declineReason: string | null;
          declinedByUser: { id: string } | null;
        }>;
      }>(app, { query: CONTRACTS, headers: orgHeader }, 'contracts');
      const declinedFromOrgView = orgView.contracts.find(
        (c) => c.id === createContract.id,
      );
      expect(declinedFromOrgView).toMatchObject({
        contractStatus: ContractStatus.DECLINED,
        declineReason: reason,
        declinedByUser: { id: org.volunteerId },
      });
    });

    it('emails the volunteer when the org declines a document they already signed', async () => {
      const { createContract } = await createContractAsAdmin();

      setAuthMockUserId(org.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: orgHeader,
        },
        'signContract',
      );

      setAuthMockUserId(org.adminId);
      const reason = 'Die Angaben sind unvollständig';
      const declined = await graphqlRequestRequiringData<{
        declineContract: {
          id: string;
          contractStatus: string;
          declinedAtSigneeType: string | null;
        };
      }>(
        app,
        {
          query: DECLINE_CONTRACT,
          variables: { contractId: createContract.id, reason },
          headers: orgHeader,
        },
        'declineContract',
      );
      expect(declined.declineContract.contractStatus).toBe(
        ContractStatus.DECLINED,
      );
      expect(declined.declineContract.declinedAtSigneeType).toBe(
        SigneeType.PERMISSION_HOLDER,
      );

      // It's dead and the volunteer has no other way to learn that — email them with the reason.
      expect(declinedByOrgEvents).toHaveLength(1);
      expect(declinedByOrgEvents[0]).toMatchObject({
        volunteerUserId: org.volunteerId,
        documentId: createContract.id,
        documentKind: DocumentKind.CONTRACT,
        reason,
      });
    });
  });

  describe('invoice lifecycle', () => {
    it('goes AWAITING_VOLUNTEER_SIGNATURE → AWAITING_SUPERVISOR_SIGNATURE → READY with hours and amount', async () => {
      // An active contract makes the timesheet compliant; the volunteer also
      // needs completed paid time entries to invoice.
      const { createContract } = await createContractAsAdmin();
      setAuthMockUserId(org.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: orgHeader,
        },
        'signContract',
      );
      setAuthMockUserId(org.adminId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: orgHeader,
        },
        'signContract',
      );

      const timeEntry = await createCompletedTimeEntry(db, {
        organizationUnitId: org.organizationUnitId,
        volunteerId: org.volunteerId,
        reimbursementTypeId: org.reimbursementTypeId,
      });

      const { createInvoice } = await graphqlRequestRequiringData<{
        createInvoice: {
          id: string;
          invoiceStatus: string;
          totalHours: number;
          totalAmountCents: number;
        };
      }>(
        app,
        {
          query: CREATE_INVOICE,
          variables: {
            input: {
              organizationUnitId: org.organizationUnitId,
              reimbursementTypeId: org.reimbursementTypeId,
              volunteerId: org.volunteerId,
              timeEntryIds: [timeEntry.id],
              periodStart: '2026-07-01T00:00:00.000Z',
              periodEnd: '2026-07-31T23:59:59.000Z',
            },
          },
          headers: orgHeader,
        },
        'createInvoice',
      );
      expect(createInvoice.invoiceStatus).toBe(
        InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE,
      );
      expect(createInvoice.totalHours).toBe(4);
      expect(createInvoice.totalAmountCents).toBe(6_000); // 4h × 1500ct

      // The volunteer is told a timesheet needs their signature too — the
      // setup contract above already emitted its own event, so filter for
      // the invoice one.
      const invoiceEvents = awaitingSignatureEvents.filter(
        (event) => event.documentKind === DocumentKind.INVOICE,
      );
      expect(invoiceEvents).toHaveLength(1);
      expect(invoiceEvents[0]).toMatchObject({
        volunteerUserId: org.volunteerId,
        documentKind: DocumentKind.INVOICE,
      });

      setAuthMockUserId(org.volunteerId);
      const mine = await graphqlRequestRequiringData<{
        myInvoices: Array<{ id: string; invoiceStatus: string }>;
      }>(app, { query: MY_INVOICES, headers: orgHeader }, 'myInvoices');
      expect(mine.myInvoices).toHaveLength(1);
      expect(mine.myInvoices[0].invoiceStatus).toBe(
        InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE,
      );

      const signed = await graphqlRequestRequiringData<{
        signInvoice: { id: string; invoiceStatus: string };
      }>(
        app,
        {
          query: SIGN_INVOICE,
          variables: { invoiceId: createInvoice.id },
          headers: orgHeader,
        },
        'signInvoice',
      );
      expect(signed.signInvoice.invoiceStatus).toBe(
        InvoiceStatus.AWAITING_SUPERVISOR_SIGNATURE,
      );

      setAuthMockUserId(org.adminId);
      const countersigned = await graphqlRequestRequiringData<{
        signInvoice: { id: string; invoiceStatus: string };
      }>(
        app,
        {
          query: SIGN_INVOICE,
          variables: { invoiceId: createInvoice.id },
          headers: orgHeader,
        },
        'signInvoice',
      );
      expect(countersigned.signInvoice.invoiceStatus).toBe(InvoiceStatus.READY);

      const detail = await graphqlRequestRequiringData<{
        invoice: {
          id: string;
          invoiceStatus: string;
          totalHours: number;
          totalAmountCents: number;
          invoiceTimeEntries: Array<{ id: string }>;
          signatures: Array<{ signedByUser: { id: string } | null }>;
          statusChanges: Array<{ type: string }>;
        };
      }>(
        app,
        {
          query: INVOICE_DETAIL,
          variables: { id: createInvoice.id },
          headers: orgHeader,
        },
        'invoice',
      );
      expect(detail.invoice).toMatchObject({
        invoiceStatus: InvoiceStatus.READY,
        totalHours: 4,
        totalAmountCents: 6_000,
      });
      expect(detail.invoice.invoiceTimeEntries).toHaveLength(1);
      expect(detail.invoice.signatures.map((s) => s.signedByUser?.id)).toEqual([
        org.volunteerId,
        org.adminId,
      ]);
    });

    it('records an invoice decline with the reason', async () => {
      const timeEntry = await createCompletedTimeEntry(db, {
        organizationUnitId: org.organizationUnitId,
        volunteerId: org.volunteerId,
        reimbursementTypeId: org.reimbursementTypeId,
      });

      setAuthMockUserId(org.adminId);
      const { createInvoice } = await graphqlRequestRequiringData<{
        createInvoice: { id: string };
      }>(
        app,
        {
          query: CREATE_INVOICE,
          variables: {
            input: {
              organizationUnitId: org.organizationUnitId,
              reimbursementTypeId: org.reimbursementTypeId,
              volunteerId: org.volunteerId,
              timeEntryIds: [timeEntry.id],
              periodStart: '2026-07-01T00:00:00.000Z',
              periodEnd: '2026-07-31T23:59:59.000Z',
            },
          },
          headers: orgHeader,
        },
        'createInvoice',
      );

      setAuthMockUserId(org.volunteerId);
      const reason = 'Stunden stimmen nicht';
      const declined = await graphqlRequestRequiringData<{
        declineInvoice: {
          id: string;
          invoiceStatus: string;
          declineReason: string;
          declinedAtSigneeType: string | null;
          declinedByUser: { id: string } | null;
        };
      }>(
        app,
        {
          query: DECLINE_INVOICE,
          variables: { invoiceId: createInvoice.id, reason },
          headers: orgHeader,
        },
        'declineInvoice',
      );
      expect(declined.declineInvoice.invoiceStatus).toBe(
        InvoiceStatus.DECLINED,
      );
      expect(declined.declineInvoice.declineReason).toBe(reason);
      expect(declined.declineInvoice.declinedAtSigneeType).toBe(
        SigneeType.VOLUNTEER,
      );
      expect(declined.declineInvoice.declinedByUser?.id).toBe(org.volunteerId);
    });
  });

  describe('org scoping', () => {
    it('a volunteer in two organisations only ever sees each org\u2019s own documents', async () => {
      // Two fresh orgs, each with its own admin and template — the shared
      // `org` already carries documents from the lifecycle tests above.
      const orgA = await setupFlowOrg(db);
      const orgB = await setupFlowOrg(db);
      const orgAHeader = { 'x-organization-unit-id': orgA.organizationUnitId };
      const orgBHeader = { 'x-organization-unit-id': orgB.organizationUnitId };

      // The same volunteer is a member of both orgs.
      const volunteerId = orgA.volunteerId;
      const [membershipB] = await db
        .insert(schema.memberships)
        .values({
          userId: volunteerId,
          organizationUnitId: orgB.organizationUnitId,
        })
        .returning();
      expect(membershipB).toBeDefined();

      // Admin A creates a contract for the volunteer in org A; admin B in org B.
      setAuthMockUserId(orgA.adminId);
      const contractA = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: orgA.organizationUnitId,
              reimbursementTypeId: orgA.reimbursementTypeId,
              volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: orgAHeader,
        },
        'createContract',
      );
      setAuthMockUserId(orgB.adminId);
      const contractB = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: orgB.organizationUnitId,
              reimbursementTypeId: orgB.reimbursementTypeId,
              volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: orgBHeader,
        },
        'createContract',
      );

      // The volunteer's view is scoped per organisation — org A's page lists
      // only org A's document, org B's page only org B's.
      setAuthMockUserId(volunteerId);
      const mineA = await graphqlRequestRequiringData<{
        myContracts: Array<{ id: string }>;
      }>(app, { query: MY_CONTRACTS, headers: orgAHeader }, 'myContracts');
      const mineB = await graphqlRequestRequiringData<{
        myContracts: Array<{ id: string }>;
      }>(app, { query: MY_CONTRACTS, headers: orgBHeader }, 'myContracts');
      expect(mineA.myContracts.map((c) => c.id)).toEqual([
        contractA.createContract.id,
      ]);
      expect(mineB.myContracts.map((c) => c.id)).toEqual([
        contractB.createContract.id,
      ]);

      // Each admin's dashboard only lists their own org's documents.
      setAuthMockUserId(orgA.adminId);
      const adminA = await graphqlRequestRequiringData<{
        contracts: Array<{ id: string }>;
      }>(app, { query: CONTRACTS, headers: orgAHeader }, 'contracts');
      setAuthMockUserId(orgB.adminId);
      const adminB = await graphqlRequestRequiringData<{
        contracts: Array<{ id: string }>;
      }>(app, { query: CONTRACTS, headers: orgBHeader }, 'contracts');
      expect(adminA.contracts.map((c) => c.id)).toEqual([
        contractA.createContract.id,
      ]);
      expect(adminB.contracts.map((c) => c.id)).toEqual([
        contractB.createContract.id,
      ]);
    });
  });

  describe('accounting gate', () => {
    it('forbids backoffice accounting operations when the org has accounting disabled, while the volunteer view stays open', async () => {
      const disabledOrg = await setupFlowOrg(db);
      const disabledHeader = {
        'x-organization-unit-id': disabledOrg.organizationUnitId,
      };
      await db
        .update(schema.organizations)
        .set({ accountingEnabled: false })
        .where(eq(schema.organizations.id, disabledOrg.organizationId));

      // The owner still holds ACCOUNTING_MANAGE, but the flag blocks access.
      setAuthMockUserId(disabledOrg.adminId);
      const contractsResponse = await graphqlRequest<{
        contracts?: Array<{ id: string }>;
      }>(app, { query: CONTRACTS, headers: disabledHeader });
      expect(contractsResponse.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      const createResponse = await graphqlRequest<{
        createContract?: { id: string };
      }>(app, {
        query: CREATE_CONTRACT,
        variables: {
          input: {
            organizationUnitId: disabledOrg.organizationUnitId,
            reimbursementTypeId: disabledOrg.reimbursementTypeId,
            volunteerId: disabledOrg.volunteerId,
            periodStart: '2026-01-01T00:00:00.000Z',
            periodEnd: '2027-01-01T00:00:00.000Z',
          },
        },
        headers: disabledHeader,
      });
      expect(createResponse.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      // The volunteer's own document list is not gated — a disabled org can
      // never have documents, so it is simply empty.
      setAuthMockUserId(disabledOrg.volunteerId);
      const mine = await graphqlRequestRequiringData<{
        myContracts: Array<{ id: string }>;
      }>(app, { query: MY_CONTRACTS, headers: disabledHeader }, 'myContracts');
      expect(mine.myContracts).toEqual([]);
    });
  });

  describe('cross-org "My documents"', () => {
    it('groups the volunteer\u2019s documents by org and counts the ones needing their signature', async () => {
      const orgA = await setupFlowOrg(db);
      const orgB = await setupFlowOrg(db);
      // The same volunteer is a member of both orgs.
      await db.insert(schema.memberships).values({
        userId: orgA.volunteerId,
        organizationUnitId: orgB.organizationUnitId,
      });

      // One awaiting contract per org, and a second active contract in org A.
      setAuthMockUserId(orgA.adminId);
      const contractA = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: orgA.organizationUnitId,
              reimbursementTypeId: orgA.reimbursementTypeId,
              volunteerId: orgA.volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: { 'x-organization-unit-id': orgA.organizationUnitId },
        },
        'createContract',
      );
      const contractA2 = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: orgA.organizationUnitId,
              reimbursementTypeId: orgA.reimbursementTypeId,
              volunteerId: orgA.volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: { 'x-organization-unit-id': orgA.organizationUnitId },
        },
        'createContract',
      );
      // Sign the second one so org A has one pending + one active.
      setAuthMockUserId(orgA.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: contractA2.createContract.id },
          headers: { 'x-organization-unit-id': orgA.organizationUnitId },
        },
        'signContract',
      );

      setAuthMockUserId(orgB.adminId);
      const contractB = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: orgB.organizationUnitId,
              reimbursementTypeId: orgB.reimbursementTypeId,
              volunteerId: orgA.volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: { 'x-organization-unit-id': orgB.organizationUnitId },
        },
        'createContract',
      );

      // The volunteer sees both orgs, each with only its own documents.
      setAuthMockUserId(orgA.volunteerId);
      const documents = await graphqlRequestRequiringData<{
        myDocuments: Array<{
          organizationUnitId: string;
          organizationName: string;
          contracts: Array<{ id: string; contractStatus: string }>;
          invoices: Array<{ id: string }>;
        }>;
      }>(app, { query: MY_DOCUMENTS }, 'myDocuments');
      expect(documents.myDocuments).toHaveLength(2);

      const groupA = documents.myDocuments.find(
        (g) => g.organizationUnitId === orgA.organizationUnitId,
      );
      const groupB = documents.myDocuments.find(
        (g) => g.organizationUnitId === orgB.organizationUnitId,
      );
      expect(groupA?.contracts.map((c) => c.id).sort()).toEqual(
        [contractA.createContract.id, contractA2.createContract.id].sort(),
      );
      expect(groupB?.contracts.map((c) => c.id)).toEqual([
        contractB.createContract.id,
      ]);

      // Summary: total documents across orgs, pending = awaiting the
      // volunteer's signature only.
      const summary = await graphqlRequestRequiringData<{
        myDocumentSummary: { total: number; pending: number };
      }>(app, { query: MY_DOCUMENT_SUMMARY }, 'myDocumentSummary');
      expect(summary.myDocumentSummary).toEqual({ total: 3, pending: 2 });
    });
  });

  describe('pdf download', () => {
    /** The renderer's structural view of the template body — mirrors the real stored shape. */
    const bodyFor = (kind: DocumentKind) => ({
      header: {
        titleLines: [
          kind === DocumentKind.CONTRACT
            ? 'Zusatzvereinbarung zur'
            : 'Stundennachweis',
        ],
        orgIdentityLine: {
          id: 'header-org-identity',
          text: '{orgName} {orgAddress}',
          fields: [
            { id: 'header-org-name', value: { kind: 'bound', source: 'org_name' } },
            { id: 'header-org-address', value: { kind: 'bound', source: 'org_address' } },
          ],
          enabled: true,
        },
      },
      blocks: [
        {
          id: 'parties',
          kind: 'text',
          title: 'Parteien',
          lines: [
            {
              id: 'volunteer-name',
              text: '{volunteerFirstName} {volunteerLastName}',
              fields: [
                { id: 'volunteer-name-first', value: { kind: 'bound', source: 'volunteer_first_name' } },
                { id: 'volunteer-name-last', value: { kind: 'bound', source: 'volunteer_last_name' } },
              ],
              enabled: true,
            },
            {
              id: 'rate',
              text: 'Stundensatz {hourlyRate} € pro Stunde',
              fields: [
                { id: 'rate-field', value: { kind: 'bound', source: 'hourly_rate' } },
              ],
              enabled: true,
            },
          ],
          enabled: true,
        },
      ],
      footer: {
        closingLine: { id: 'closing', text: 'Vielen Dank', fields: [], enabled: true },
        showSignatures: true,
      },
    });

    it('attaches a real PDF with resolved values and signature seats once the contract is fully signed', async () => {
      // A dedicated org so the template body here is the one the renderer sees.
      const pdfOrg = await setupFlowOrg(db);
      const pdfOrgHeader = {
        'x-organization-unit-id': pdfOrg.organizationUnitId,
      };
      // Replace the empty default body with a renderable one.
      await db
        .update(schema.documentTemplates)
        .set({ body: bodyFor(DocumentKind.CONTRACT) })
        .where(
          eq(schema.documentTemplates.organizationId, pdfOrg.organizationId),
        );

      setAuthMockUserId(pdfOrg.adminId);
      const { createContract } = await graphqlRequestRequiringData<{
        createContract: { id: string; contractStatus: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: pdfOrg.organizationUnitId,
              reimbursementTypeId: pdfOrg.reimbursementTypeId,
              volunteerId: pdfOrg.volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: pdfOrgHeader,
        },
        'createContract',
      );

      setAuthMockUserId(pdfOrg.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: pdfOrgHeader,
        },
        'signContract',
      );

      setAuthMockUserId(pdfOrg.adminId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: pdfOrgHeader,
        },
        'signContract',
      );

      // The mutation response predates the render — refetch for the file link.
      const detail = await graphqlRequestRequiringData<{
        contract: {
          id: string;
          contractStatus: string;
          downloadUrl: string | null;
        };
      }>(
        app,
        {
          query: CONTRACT_DETAIL,
          variables: { id: createContract.id },
          headers: pdfOrgHeader,
        },
        'contract',
      );
      expect(detail.contract.contractStatus).toBe(ContractStatus.ACTIVE);

      // PDF attachment needs object storage. When STORAGE_ENDPOINT is not
      // configured (e.g. the suite is run from a working directory that does
      // not load the backend .env), the renderer must fail gracefully and
      // leave downloadUrl null rather than break the sign. When it is
      // configured, the rendered PDF is actually downloadable.
      if (!process.env.STORAGE_ENDPOINT) {
        expect(detail.contract.downloadUrl).toBeNull();
        return;
      }
      expect(detail.contract.downloadUrl).not.toBeNull();

      // Read the stored bytes back through the downloadable URL.
      const pdfResponse = await fetch(detail.contract.downloadUrl!);
      expect(pdfResponse.ok).toBe(true);
      const pdfBytes = Buffer.from(await pdfResponse.arrayBuffer());
      expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdfBytes.length).toBeGreaterThan(500);

      // The PDF carries the resolved volunteer name. Text is Flate-compressed
      // in the content stream, so inflate it before reading.
      const { inflateSync } = await import('node:zlib');
      const latin = pdfBytes.toString('latin1');
      const streams = [...latin.matchAll(/stream\r?\n([\s\S]*?)endstream/g)].map(
        (m) => inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'),
      );
      const content = streams.join('\n');

      const volunteer = await db.query.users.findFirst({
        where: { id: pdfOrg.volunteerId },
      });
      // Glyph runs are hex-encoded; decode them so name/rate are comparable.
      const glyphs = [
        ...content.matchAll(/<([0-9a-f]+)>/g),
      ]
        .map((m) => Buffer.from(m[1], 'hex').toString('latin1'))
        .join('');
      expect(glyphs).toContain(volunteer?.name ?? '');
      expect(glyphs).toContain('Unterschrift');
    });

    it('attaches a real PDF for a fully-signed invoice too, with its time-entry table', async () => {
      const pdfOrg = await setupFlowOrg(db);
      const pdfOrgHeader = {
        'x-organization-unit-id': pdfOrg.organizationUnitId,
      };
      await db
        .update(schema.documentTemplates)
        .set({ body: bodyFor(DocumentKind.INVOICE) })
        .where(
          eq(schema.documentTemplates.organizationId, pdfOrg.organizationId),
        );

      // Active contract (compliance) + a completed paid time entry.
      setAuthMockUserId(pdfOrg.adminId);
      const { createContract } = await graphqlRequestRequiringData<{
        createContract: { id: string };
      }>(
        app,
        {
          query: CREATE_CONTRACT,
          variables: {
            input: {
              organizationUnitId: pdfOrg.organizationUnitId,
              reimbursementTypeId: pdfOrg.reimbursementTypeId,
              volunteerId: pdfOrg.volunteerId,
              periodStart: '2026-01-01T00:00:00.000Z',
              periodEnd: '2027-01-01T00:00:00.000Z',
            },
          },
          headers: pdfOrgHeader,
        },
        'createContract',
      );
      setAuthMockUserId(pdfOrg.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: pdfOrgHeader,
        },
        'signContract',
      );
      setAuthMockUserId(pdfOrg.adminId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_CONTRACT,
          variables: { contractId: createContract.id },
          headers: pdfOrgHeader,
        },
        'signContract',
      );

      const timeEntry = await createCompletedTimeEntry(db, {
        organizationUnitId: pdfOrg.organizationUnitId,
        volunteerId: pdfOrg.volunteerId,
        reimbursementTypeId: pdfOrg.reimbursementTypeId,
      });
      const { createInvoice } = await graphqlRequestRequiringData<{
        createInvoice: { id: string; invoiceStatus: string };
      }>(
        app,
        {
          query: CREATE_INVOICE,
          variables: {
            input: {
              organizationUnitId: pdfOrg.organizationUnitId,
              reimbursementTypeId: pdfOrg.reimbursementTypeId,
              volunteerId: pdfOrg.volunteerId,
              timeEntryIds: [timeEntry.id],
              periodStart: '2026-07-01T00:00:00.000Z',
              periodEnd: '2026-07-31T23:59:59.000Z',
            },
          },
          headers: pdfOrgHeader,
        },
        'createInvoice',
      );

      setAuthMockUserId(pdfOrg.volunteerId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_INVOICE,
          variables: { invoiceId: createInvoice.id },
          headers: pdfOrgHeader,
        },
        'signInvoice',
      );
      setAuthMockUserId(pdfOrg.adminId);
      await graphqlRequestRequiringData(
        app,
        {
          query: SIGN_INVOICE,
          variables: { invoiceId: createInvoice.id },
          headers: pdfOrgHeader,
        },
        'signInvoice',
      );

      const detail = await graphqlRequestRequiringData<{
        invoice: {
          id: string;
          invoiceStatus: string;
          downloadUrl: string | null;
        };
      }>(
        app,
        {
          query: INVOICE_DETAIL,
          variables: { id: createInvoice.id },
          headers: pdfOrgHeader,
        },
        'invoice',
      );
      expect(detail.invoice.invoiceStatus).toBe(InvoiceStatus.READY);

      if (!process.env.STORAGE_ENDPOINT) {
        expect(detail.invoice.downloadUrl).toBeNull();
        return;
      }
      expect(detail.invoice.downloadUrl).not.toBeNull();

      const pdfResponse = await fetch(detail.invoice.downloadUrl!);
      expect(pdfResponse.ok).toBe(true);
      const pdfBytes = Buffer.from(await pdfResponse.arrayBuffer());
      expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');

      const { inflateSync } = await import('node:zlib');
      const latin = pdfBytes.toString('latin1');
      const streams = [...latin.matchAll(/stream\r?\n([\s\S]*?)endstream/g)].map(
        (m) => inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'),
      );
      const content = streams.join('\n');
      const glyphs = [...content.matchAll(/<([0-9a-f]+)>/g)]
        .map((m) => Buffer.from(m[1], 'hex').toString('latin1'))
        .join('');
      // The invoice table lists the shift that produced the time entry.
      expect(glyphs).toContain('Stundennachweis');
      expect(glyphs).toContain('Unterschrift');
    });
  });
});
