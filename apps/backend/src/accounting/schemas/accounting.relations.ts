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
    createdDocuments: r.many.createdDocuments({
      from: r.reimbursementTypes.id,
      to: r.createdDocuments.reimbursementTypeId,
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
    createdDocuments: r.many.createdDocuments({
      from: r.documentTemplates.id,
      to: r.createdDocuments.documentTemplateId,
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
  createdDocuments: {
    documentTemplate: r.one.documentTemplates({
      from: r.createdDocuments.documentTemplateId,
      to: r.documentTemplates.id,
    }),
    volunteer: r.one.users({
      from: r.createdDocuments.volunteerId,
      to: r.users.id,
    }),
    reimbursementType: r.one.reimbursementTypes({
      from: r.createdDocuments.reimbursementTypeId,
      to: r.reimbursementTypes.id,
    }),
    declinedByUser: r.one.users({
      from: r.createdDocuments.declinedByUserId,
      to: r.users.id,
    }),
    signatures: r.many.documentSignatures({
      from: r.createdDocuments.id,
      to: r.documentSignatures.createdDocumentId,
    }),
    events: r.many.documentEvents({
      from: r.createdDocuments.id,
      to: r.documentEvents.createdDocumentId,
    }),
    invoiceTimeEntries: r.many.invoiceTimeEntries({
      from: r.createdDocuments.id,
      to: r.invoiceTimeEntries.createdDocumentId,
    }),
  },
  documentSignatures: {
    createdDocument: r.one.createdDocuments({
      from: r.documentSignatures.createdDocumentId,
      to: r.createdDocuments.id,
    }),
    requiredPermission: r.one.permissions({
      from: r.documentSignatures.requiredPermissionId,
      to: r.permissions.id,
    }),
    signedByUser: r.one.users({
      from: r.documentSignatures.signedByUserId,
      to: r.users.id,
    }),
  },
  documentEvents: {
    createdDocument: r.one.createdDocuments({
      from: r.documentEvents.createdDocumentId,
      to: r.createdDocuments.id,
    }),
    actorUser: r.one.users({
      from: r.documentEvents.actorUserId,
      to: r.users.id,
    }),
  },
  invoiceTimeEntries: {
    createdDocument: r.one.createdDocuments({
      from: r.invoiceTimeEntries.createdDocumentId,
      to: r.createdDocuments.id,
    }),
    timeEntry: r.one.timeEntries({
      from: r.invoiceTimeEntries.timeEntryId,
      to: r.timeEntries.id,
    }),
  },
}));
