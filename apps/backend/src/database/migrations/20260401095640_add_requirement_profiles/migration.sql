CREATE TYPE "requirement_type" AS ENUM('DOCUMENT', 'CHECK', 'DATE', 'TEXT');--> statement-breakpoint
CREATE TYPE "requirement_fulfillment_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "requirement_profile_submission_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "organization_user_profile_status" AS ENUM('PENDING', 'ACTIVE', 'BLACKLISTED', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"type" "requirement_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mandatory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requirement_profile_submission_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"organization_user_profile_id" uuid,
	"document_id" uuid,
	"value" jsonb,
	"status" "requirement_fulfillment_status" DEFAULT 'DRAFT'::"requirement_fulfillment_status" NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"organization_unit_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_profile_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requirement_profile_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_requirement_profile_requirements_profile_requirement" UNIQUE("requirement_profile_id","requirement_id")
);
--> statement-breakpoint
CREATE TABLE "requirement_profile_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"requirement_profile_id" uuid NOT NULL,
	"membership_id" uuid,
	"membership_request_id" uuid,
	"status" "requirement_profile_submission_status" DEFAULT 'DRAFT'::"requirement_profile_submission_status" NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"mime_type" text NOT NULL,
	"uploaded_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "organization_user_profile_status" DEFAULT 'PENDING'::"organization_user_profile_status" NOT NULL,
	"can_access_phone_number" boolean DEFAULT false NOT NULL,
	"can_access_address" boolean DEFAULT false NOT NULL,
	"can_access_bank_account_number" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_requirements_organization_id" ON "requirements" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_submission_id" ON "requirement_fulfillments" ("requirement_profile_submission_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_requirement_id" ON "requirement_fulfillments" ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_profile_id" ON "requirement_fulfillments" ("organization_user_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_document_id" ON "requirement_fulfillments" ("document_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_reviewed_by_id" ON "requirement_fulfillments" ("reviewed_by_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profiles_organization_id" ON "requirement_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profiles_organization_unit_id" ON "requirement_profiles" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_requirements_profile_id" ON "requirement_profile_requirements" ("requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_requirements_requirement_id" ON "requirement_profile_requirements" ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_profile_id" ON "requirement_profile_submissions" ("requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_membership_id" ON "requirement_profile_submissions" ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_membership_request_id" ON "requirement_profile_submissions" ("membership_request_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_reviewed_by_id" ON "requirement_profile_submissions" ("reviewed_by_id");--> statement-breakpoint
CREATE INDEX "idx_documents_user_id" ON "documents" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_organization_id" ON "organization_user_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_user_id" ON "organization_user_profiles" ("user_id");--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_SSi8x4wpJ4c0_fkey" FOREIGN KEY ("requirement_profile_submission_id") REFERENCES "requirement_profile_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_requirement_id_requirements_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_DsUV3QFu7hSK_fkey" FOREIGN KEY ("organization_user_profile_id") REFERENCES "organization_user_profiles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_reviewed_by_id_users_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profiles" ADD CONSTRAINT "requirement_profiles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profiles" ADD CONSTRAINT "requirement_profiles_QxzGRGWVynYf_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profile_requirements" ADD CONSTRAINT "requirement_profile_requirements_2bdUJ4zBfOtP_fkey" FOREIGN KEY ("requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profile_requirements" ADD CONSTRAINT "requirement_profile_requirements_9WTdnZHUUErT_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_Exl1MZS3y1B6_fkey" FOREIGN KEY ("requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_fzxMBJUWWAzQ_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_JCCJ6yr7JOfs_fkey" FOREIGN KEY ("membership_request_id") REFERENCES "membership_requests"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_reviewed_by_id_users_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_WTRTxwUqszuD_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;