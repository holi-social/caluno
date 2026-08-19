import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const accountingRelations = defineRelationsPart(schema, (r) => ({
  reimbursementTypes: {
    rates: r.many.reimbursementRates({
      from: r.reimbursementTypes.id,
      to: r.reimbursementRates.reimbursementTypeId,
    }),
    documentTemplates: r.many.documentTemplates({
      from: r.reimbursementTypes.id,
      to: r.documentTemplates.reimbursementTypeId,
    }),
    contracts: r.many.contracts({
      from: r.reimbursementTypes.id,
      to: r.contracts.reimbursementTypeId,
    }),
    invoices: r.many.invoices({
      from: r.reimbursementTypes.id,
      to: r.invoices.reimbursementTypeId,
    }),
  },
  reimbursementRates: {
    organization: r.one.organizations({
      from: r.reimbursementRates.organizationId,
      to: r.organizations.id,
    }),
    reimbursementType: r.one.reimbursementTypes({
      from: r.reimbursementRates.reimbursementTypeId,
      to: r.reimbursementTypes.id,
    }),
  },
  documentTemplates: {
    organization: r.one.organizations({
      from: r.documentTemplates.organizationId,
      to: r.organizations.id,
    }),
    reimbursementType: r.one.reimbursementTypes({
      from: r.documentTemplates.reimbursementTypeId,
      to: r.reimbursementTypes.id,
    }),
    lastEditedByUser: r.one.users({
      from: r.documentTemplates.lastEditedBy,
      to: r.users.id,
    }),
    signees: r.many.templateSignees({
      from: r.documentTemplates.id,
      to: r.templateSignees.documentTemplateId,
    }),
    contracts: r.many.contracts({
      from: r.documentTemplates.id,
      to: r.contracts.documentTemplateId,
    }),
    invoices: r.many.invoices({
      from: r.documentTemplates.id,
      to: r.invoices.documentTemplateId,
    }),
  },
  templateSignees: {
    documentTemplate: r.one.documentTemplates({
      from: r.templateSignees.documentTemplateId,
      to: r.documentTemplates.id,
    }),
    requiredPermission: r.one.permissions({
      from: r.templateSignees.requiredPermissionId,
      to: r.permissions.id,
    }),
  },
  contracts: {
    documentTemplate: r.one.documentTemplates({
      from: r.contracts.documentTemplateId,
      to: r.documentTemplates.id,
    }),
    volunteer: r.one.users({
      from: r.contracts.volunteerId,
      to: r.users.id,
    }),
    reimbursementType: r.one.reimbursementTypes({
      from: r.contracts.reimbursementTypeId,
      to: r.reimbursementTypes.id,
    }),
    declinedByUser: r.one.users({
      from: r.contracts.declinedByUserId,
      to: r.users.id,
    }),
    signatures: r.many.contractSignatures({
      from: r.contracts.id,
      to: r.contractSignatures.contractId,
    }),
    events: r.many.contractEvents({
      from: r.contracts.id,
      to: r.contractEvents.contractId,
    }),
  },
  invoices: {
    documentTemplate: r.one.documentTemplates({
      from: r.invoices.documentTemplateId,
      to: r.documentTemplates.id,
    }),
    volunteer: r.one.users({
      from: r.invoices.volunteerId,
      to: r.users.id,
    }),
    reimbursementType: r.one.reimbursementTypes({
      from: r.invoices.reimbursementTypeId,
      to: r.reimbursementTypes.id,
    }),
    declinedByUser: r.one.users({
      from: r.invoices.declinedByUserId,
      to: r.users.id,
    }),
    signatures: r.many.invoiceSignatures({
      from: r.invoices.id,
      to: r.invoiceSignatures.invoiceId,
    }),
    events: r.many.invoiceEvents({
      from: r.invoices.id,
      to: r.invoiceEvents.invoiceId,
    }),
    invoiceTimeEntries: r.many.invoiceTimeEntries({
      from: r.invoices.id,
      to: r.invoiceTimeEntries.invoiceId,
    }),
  },
  contractSignatures: {
    contract: r.one.contracts({
      from: r.contractSignatures.contractId,
      to: r.contracts.id,
    }),
    requiredPermission: r.one.permissions({
      from: r.contractSignatures.requiredPermissionId,
      to: r.permissions.id,
    }),
    signedByUser: r.one.users({
      from: r.contractSignatures.signedByUserId,
      to: r.users.id,
    }),
  },
  invoiceSignatures: {
    invoice: r.one.invoices({
      from: r.invoiceSignatures.invoiceId,
      to: r.invoices.id,
    }),
    requiredPermission: r.one.permissions({
      from: r.invoiceSignatures.requiredPermissionId,
      to: r.permissions.id,
    }),
    signedByUser: r.one.users({
      from: r.invoiceSignatures.signedByUserId,
      to: r.users.id,
    }),
  },
  contractEvents: {
    contract: r.one.contracts({
      from: r.contractEvents.contractId,
      to: r.contracts.id,
    }),
    actorUser: r.one.users({
      from: r.contractEvents.actorUserId,
      to: r.users.id,
    }),
  },
  invoiceEvents: {
    invoice: r.one.invoices({
      from: r.invoiceEvents.invoiceId,
      to: r.invoices.id,
    }),
    actorUser: r.one.users({
      from: r.invoiceEvents.actorUserId,
      to: r.users.id,
    }),
  },
  invoiceTimeEntries: {
    invoice: r.one.invoices({
      from: r.invoiceTimeEntries.invoiceId,
      to: r.invoices.id,
    }),
    timeEntry: r.one.timeEntries({
      from: r.invoiceTimeEntries.timeEntryId,
      to: r.timeEntries.id,
    }),
  },
}));
