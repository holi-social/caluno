CREATE TYPE "form_submission_status" AS ENUM('SUBMITTED', 'DRAFT');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL UNIQUE,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"required" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_block_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"block_id" uuid NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"placeholder" text,
	"description" text,
	"required" boolean DEFAULT false NOT NULL,
	"lock_type" boolean DEFAULT false NOT NULL,
	"system_key" text,
	"options" jsonb,
	"document_url" text,
	"document_label" text,
	"min_age" integer,
	"field_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"locale" text DEFAULT 'de' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"share_token" text NOT NULL UNIQUE,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_requirement_forms_organization_id_slug" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "requirement_form_block_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"form_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"field_order" integer DEFAULT 0 NOT NULL,
	"required" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"form_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"membership_id" uuid,
	"status" "form_submission_status" DEFAULT 'SUBMITTED'::"form_submission_status" NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submission_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_form_blocks_organization_id" ON "form_blocks" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_form_blocks_created_by" ON "form_blocks" ("created_by");--> statement-breakpoint
CREATE INDEX "idx_form_block_fields_block_id" ON "form_block_fields" ("block_id");--> statement-breakpoint
CREATE INDEX "idx_form_block_fields_system_key" ON "form_block_fields" ("system_key");--> statement-breakpoint
CREATE INDEX "idx_requirement_forms_organization_id" ON "requirement_forms" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_forms_share_token" ON "requirement_forms" ("share_token");--> statement-breakpoint
CREATE INDEX "idx_requirement_form_block_refs_form_id" ON "requirement_form_block_refs" ("form_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_form_block_refs_block_id" ON "requirement_form_block_refs" ("block_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_form_id" ON "form_submissions" ("form_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_user_id" ON "form_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_membership_id" ON "form_submissions" ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_submission_id" ON "form_submission_values" ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_field_id" ON "form_submission_values" ("field_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_block_id" ON "form_submission_values" ("block_id");--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "form_block_fields" ADD CONSTRAINT "form_block_fields_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "requirement_form_block_refs" ADD CONSTRAINT "requirement_form_block_refs_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_form_block_refs" ADD CONSTRAINT "requirement_form_block_refs_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_membership_id_memberships_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_submission_id_form_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_field_id_form_block_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "form_block_fields"("id");--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id");--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_organization_id_organizations_id_fkey", ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;