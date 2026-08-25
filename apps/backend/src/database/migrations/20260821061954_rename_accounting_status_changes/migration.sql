ALTER TYPE "document_event_type" RENAME TO "document_status_change";--> statement-breakpoint
ALTER TABLE "contract_events" RENAME TO "contract_status_changes";--> statement-breakpoint
ALTER TABLE "invoice_events" RENAME TO "invoice_status_changes";--> statement-breakpoint
ALTER INDEX "idx_invoice_events_invoice_id" RENAME TO "idx_invoice_status_changes_invoice_id";--> statement-breakpoint
DROP INDEX "idx_contract_events_contract_id";--> statement-breakpoint
DROP INDEX "uq_document_templates_organization_id_reimbursement_type_id_kind";--> statement-breakpoint
ALTER TABLE "document_templates" ADD COLUMN "organization_unit_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_contract_status_changes_contract_id" ON "contract_status_changes" ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_templates_org_default" ON "document_templates" ("organization_id","reimbursement_type_id","kind") WHERE "organization_unit_id" IS NULL AND "is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_templates_unit_override" ON "document_templates" ("organization_unit_id","reimbursement_type_id","kind") WHERE "organization_unit_id" IS NOT NULL AND "is_deleted" = false;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_uuFF8AwlphzS_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;