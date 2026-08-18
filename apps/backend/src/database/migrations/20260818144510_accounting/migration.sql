CREATE TYPE "contract_status" AS ENUM('AWAITING_VOLUNTEER_SIGNATURE', 'AWAITING_NGO_SIGNATURE', 'ACTIVE', 'EXPIRED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "invoice_status" AS ENUM('AWAITING_VOLUNTEER_SIGNATURE', 'AWAITING_SUPERVISOR_SIGNATURE', 'READY', 'DECLINED');--> statement-breakpoint
CREATE TYPE "document_event_type" AS ENUM('CREATED', 'SIGNED', 'COUNTERSIGNED', 'ACTIVATED', 'DECLINED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "document_kind" AS ENUM('CONTRACT', 'INVOICE');--> statement-breakpoint
CREATE TYPE "renewal_cadence" AS ENUM('YEARLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "reimbursement_type_key" AS ENUM('EHRENAMT', 'UEBUNGSLEITER');--> statement-breakpoint
CREATE TYPE "signee_type" AS ENUM('VOLUNTEER', 'PERMISSION_HOLDER');--> statement-breakpoint
CREATE TABLE "created_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_template_id" uuid NOT NULL,
	"volunteer_id" text NOT NULL,
	"reimbursement_type_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"contract_status" "contract_status",
	"invoice_status" "invoice_status",
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"renew_date" timestamp,
	"total_amount_cents" integer,
	"total_hours" numeric(10,2),
	"is_non_compliant" boolean DEFAULT false NOT NULL,
	"resolved_body" jsonb NOT NULL,
	"decline_reason" text,
	"declined_by_user_id" text,
	"declined_at" timestamp,
	"declined_at_signee_type" "signee_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_created_documents_status_matches_kind" CHECK (("kind" = 'CONTRACT' AND "contract_status" IS NOT NULL AND "invoice_status" IS NULL) OR ("kind" = 'INVOICE' AND "invoice_status" IS NOT NULL AND "contract_status" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "document_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_document_id" uuid NOT NULL,
	"type" "document_event_type" NOT NULL,
	"actor_user_id" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_document_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"signee_type" "signee_type" NOT NULL,
	"required_permission_id" uuid,
	"signed_by_user_id" text,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_document_signatures_required_permission_matches_signee_type" CHECK (("signee_type" = 'PERMISSION_HOLDER' AND "required_permission_id" IS NOT NULL) OR ("signee_type" = 'VOLUNTEER' AND "required_permission_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"reimbursement_type_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"renewal_cadence" "renewal_cadence",
	"invoice_number_format" text,
	"body" jsonb NOT NULL,
	"last_edited_at" timestamp,
	"last_edited_by" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_document_id" uuid NOT NULL,
	"time_entry_id" uuid NOT NULL CONSTRAINT "uq_invoice_time_entries_time_entry_id" UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reimbursement_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"reimbursement_type_id" uuid NOT NULL,
	"hourly_rate_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_reimbursement_rates_organization_id_reimbursement_type_id" UNIQUE("organization_id","reimbursement_type_id")
);
--> statement-breakpoint
CREATE TABLE "reimbursement_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" "reimbursement_type_key" NOT NULL CONSTRAINT "uq_reimbursement_types_key" UNIQUE,
	"legal_reference" text NOT NULL,
	"yearly_limit_cents" integer NOT NULL,
	"platform_default_rate_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_signees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_template_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"signee_type" "signee_type" NOT NULL,
	"required_permission_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_template_signees_required_permission_matches_signee_type" CHECK (("signee_type" = 'PERMISSION_HOLDER' AND "required_permission_id" IS NOT NULL) OR ("signee_type" = 'VOLUNTEER' AND "required_permission_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "accounting_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "reimbursement_type_id" uuid;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_document_events_created_document_id" ON "document_events" ("created_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_templates_organization_id_reimbursement_type_id_kind" ON "document_templates" ("organization_id","reimbursement_type_id","kind") WHERE "is_deleted" = false;--> statement-breakpoint
ALTER TABLE "created_documents" ADD CONSTRAINT "created_documents_gs0YacWabMXq_fkey" FOREIGN KEY ("document_template_id") REFERENCES "document_templates"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "created_documents" ADD CONSTRAINT "created_documents_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "created_documents" ADD CONSTRAINT "created_documents_C9DzEOwaRIci_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "created_documents" ADD CONSTRAINT "created_documents_declined_by_user_id_users_id_fkey" FOREIGN KEY ("declined_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_created_document_id_created_documents_id_fkey" FOREIGN KEY ("created_document_id") REFERENCES "created_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_actor_user_id_users_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_k78HNFeYfdcS_fkey" FOREIGN KEY ("created_document_id") REFERENCES "created_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_required_permission_id_permissions_id_fkey" FOREIGN KEY ("required_permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_signed_by_user_id_users_id_fkey" FOREIGN KEY ("signed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_dBOb81rs3ftQ_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_last_edited_by_users_id_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "invoice_time_entries" ADD CONSTRAINT "invoice_time_entries_YLr2BquT4p8X_fkey" FOREIGN KEY ("created_document_id") REFERENCES "created_documents"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invoice_time_entries" ADD CONSTRAINT "invoice_time_entries_time_entry_id_time_entries_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "reimbursement_rates" ADD CONSTRAINT "reimbursement_rates_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reimbursement_rates" ADD CONSTRAINT "reimbursement_rates_RDd1dX429TuF_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "template_signees" ADD CONSTRAINT "template_signees_4VK8PQ5EFhiQ_fkey" FOREIGN KEY ("document_template_id") REFERENCES "document_templates"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "template_signees" ADD CONSTRAINT "template_signees_required_permission_id_permissions_id_fkey" FOREIGN KEY ("required_permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_reimbursement_type_id_reimbursement_types_id_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "chk_time_entries_paid_requires_reimbursement_type" CHECK ("is_paid" = false OR "reimbursement_type_id" IS NOT NULL);