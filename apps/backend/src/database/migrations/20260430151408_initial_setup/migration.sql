CREATE TYPE "membership_request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "organization_user_profile_status" AS ENUM('PENDING', 'ACTIVE', 'BLACKLISTED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "requirement_type" AS ENUM('DOCUMENT', 'CHECK', 'DATE', 'TEXT');--> statement-breakpoint
CREATE TYPE "requirement_fulfillment_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "requirement_profile_submission_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "shift_visibility" AS ENUM('INVITED_MEMBERS', 'ALL_MEMBERS');--> statement-breakpoint
CREATE TYPE "shift_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"check_in_id" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_roles_name_organization_unit_id" UNIQUE("name","organization_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_role_permissions_role_id_permission_id" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"organization_unit_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"membership_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_membership_roles_membership_id_role_id" UNIQUE("membership_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "membership_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"organization_unit_id" uuid NOT NULL,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"status" "membership_request_status" DEFAULT 'PENDING'::"membership_request_status" NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "uq_membership_requests_user_id_organization_unit_id" UNIQUE("user_id","organization_unit_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"website_url" text,
	"email" text,
	"phone" text,
	"description" text,
	"address" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"parent_id" uuid,
	"type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"website_url" text,
	"email" text,
	"phone" text,
	"description" text,
	"address" text,
	"required_membership_requirement_profile_id" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_organization_units_organization_id_slug" UNIQUE("organization_id","slug"),
	CONSTRAINT "uq_organization_units_organization_id_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_organization_units_not_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);
--> statement-breakpoint
CREATE TABLE "organization_unit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"icon" text,
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
	"user_profile_access_approved" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"type" "requirement_type" NOT NULL,
	"value" jsonb,
	"status" "requirement_fulfillment_status" DEFAULT 'DRAFT'::"requirement_fulfillment_status" NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
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
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"instructions" text,
	"organization_unit_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"location" text,
	"visibility" "shift_visibility" DEFAULT 'ALL_MEMBERS'::"shift_visibility" NOT NULL,
	"max_volunteers" integer,
	"rrule" text,
	"original_starts_at" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"master_id" uuid NOT NULL,
	"actual_starts_at" timestamp NOT NULL,
	"actual_ends_at" timestamp NOT NULL,
	"override_title" text,
	"override_instructions" text,
	"override_location" text,
	"override_max_volunteers" integer,
	"is_exception" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"occurrence_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_instance_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" DEFAULT 'PENDING'::"shift_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sii_instance_user" UNIQUE("instance_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shift_instance_id" uuid NOT NULL,
	"volunteer_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
CREATE INDEX "idx_permissions_key" ON "permissions" ("key");--> statement-breakpoint
CREATE INDEX "idx_roles_organization_id" ON "roles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_user_id" ON "memberships" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_organization_unit_id" ON "memberships" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_membership_roles_membership_id" ON "membership_roles" ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_membership_roles_role_id" ON "membership_roles" ("role_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_user_id" ON "membership_requests" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_organization_unit_id" ON "membership_requests" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_name" ON "organizations" ("name");--> statement-breakpoint
CREATE INDEX "idx_organizations_deleted_at" ON "organizations" ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_organization_units_organization_id_is_root_true" ON "organization_units" ("organization_id") WHERE "parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_organization_units_parent_id" ON "organization_units" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_required_profile_id" ON "organization_units" ("required_membership_requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_type_id" ON "organization_units" ("type_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_name" ON "organization_units" ("name");--> statement-breakpoint
CREATE INDEX "idx_organization_units_deleted_at" ON "organization_units" ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_organization_unit_types_name" ON "organization_unit_types" ("name");--> statement-breakpoint
CREATE INDEX "idx_documents_user_id" ON "documents" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_organization_id" ON "organization_user_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_user_id" ON "organization_user_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_requirements_organization_id" ON "requirements" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_submission_id" ON "requirement_fulfillments" ("requirement_profile_submission_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_requirement_id" ON "requirement_fulfillments" ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_profile_id" ON "requirement_fulfillments" ("organization_user_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_fulfillments_reviewed_by_id" ON "requirement_fulfillments" ("reviewed_by_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profiles_organization_id" ON "requirement_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_requirements_profile_id" ON "requirement_profile_requirements" ("requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_requirements_requirement_id" ON "requirement_profile_requirements" ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_profile_id" ON "requirement_profile_submissions" ("requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_membership_id" ON "requirement_profile_submissions" ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_membership_request_id" ON "requirement_profile_submissions" ("membership_request_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_profile_submissions_reviewed_by_id" ON "requirement_profile_submissions" ("reviewed_by_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_org_unit_id" ON "shifts" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_created_by_id" ON "shifts" ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_slug" ON "shifts" ("slug");--> statement-breakpoint
CREATE INDEX "idx_shifts_is_deleted" ON "shifts" ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_si_master_id" ON "shift_instances" ("master_id");--> statement-breakpoint
CREATE INDEX "idx_si_actual_starts_at" ON "shift_instances" ("actual_starts_at");--> statement-breakpoint
CREATE INDEX "idx_si_actual_ends_at" ON "shift_instances" ("actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_active_range" ON "shift_instances" ("actual_starts_at","actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_is_exception" ON "shift_instances" ("is_exception");--> statement-breakpoint
CREATE INDEX "idx_si_is_cancelled" ON "shift_instances" ("is_cancelled");--> statement-breakpoint
CREATE INDEX "idx_sii_instance_id" ON "shift_instance_invites" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_sii_user_id" ON "shift_instance_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sii_status" ON "shift_instance_invites" ("status");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_memberships_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_JnW42Hb2WNYu_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parent_id_organization_units_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_type_id_organization_unit_types_id_fkey" FOREIGN KEY ("type_id") REFERENCES "organization_unit_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_Wl3widDJ46RJ_fkey" FOREIGN KEY ("required_membership_requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "fk_organization_units_parent_same_organization" FOREIGN KEY ("organization_id","parent_id") REFERENCES "organization_units"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_WTRTxwUqszuD_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_SSi8x4wpJ4c0_fkey" FOREIGN KEY ("requirement_profile_submission_id") REFERENCES "requirement_profile_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_requirement_id_requirements_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_DsUV3QFu7hSK_fkey" FOREIGN KEY ("organization_user_profile_id") REFERENCES "organization_user_profiles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_fulfillments" ADD CONSTRAINT "requirement_fulfillments_reviewed_by_id_users_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profiles" ADD CONSTRAINT "requirement_profiles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profile_requirements" ADD CONSTRAINT "requirement_profile_requirements_2bdUJ4zBfOtP_fkey" FOREIGN KEY ("requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profile_requirements" ADD CONSTRAINT "requirement_profile_requirements_9WTdnZHUUErT_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_Exl1MZS3y1B6_fkey" FOREIGN KEY ("requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_fzxMBJUWWAzQ_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_JCCJ6yr7JOfs_fkey" FOREIGN KEY ("membership_request_id") REFERENCES "membership_requests"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "requirement_profile_submissions" ADD CONSTRAINT "requirement_profile_submissions_reviewed_by_id_users_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_master_id_shifts_id_fkey" FOREIGN KEY ("master_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_shift_instance_id_shift_instances_id_fkey" FOREIGN KEY ("shift_instance_id") REFERENCES "shift_instances"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE RESTRICT;