CREATE TYPE "event_invite_status" AS ENUM('ADMIN_INVITED', 'AWAITING_ADMIN_APPROVAL', 'WAITLIST_JOINED', 'JOINED', 'VOLUNTEER_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_REJECTED');--> statement-breakpoint
CREATE TYPE "membership_request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "organization_user_profile_status" AS ENUM('PENDING', 'ACTIVE', 'BLACKLISTED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "requirement_type" AS ENUM('DOCUMENT', 'CHECK', 'DATE', 'TEXT');--> statement-breakpoint
CREATE TYPE "requirement_fulfillment_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "requirement_profile_submission_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "shift_visibility" AS ENUM('INVITED_MEMBERS', 'ALL_MEMBERS');--> statement-breakpoint
CREATE TYPE "shift_call_out_delivery_status" AS ENUM('SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "shift_call_out_source" AS ENUM('MANUAL', 'AUTOMATIC');--> statement-breakpoint
CREATE TYPE "shift_invite_status" AS ENUM('ADMIN_INVITED', 'AWAITING_ADMIN_APPROVAL', 'WAITLIST_JOINED', 'JOINED', 'VOLUNTEER_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_REJECTED');--> statement-breakpoint
CREATE TYPE "shift_manager_notification_kind" AS ENUM('CALL_OUT_SUMMARY', 'REMINDER');--> statement-breakpoint
CREATE TYPE "file_purpose" AS ENUM('requirement_document', 'document', 'form_document', 'org_logo', 'organization_logo', 'event_image', 'shift_image', 'profile_picture');--> statement-breakpoint
CREATE TYPE "file_status" AS ENUM('pending', 'uploaded', 'failed');--> statement-breakpoint
CREATE TYPE "file_visibility" AS ENUM('private', 'public');--> statement-breakpoint
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
	"locale" text,
	"email_weekly_update_enabled" boolean DEFAULT true NOT NULL,
	"email_urgent_calls_enabled" boolean DEFAULT true NOT NULL,
	"email_platform_enabled" boolean DEFAULT true NOT NULL,
	"privacy_policy_version" text,
	"privacy_policy_accepted_at" timestamp,
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
	"organization_id" uuid NOT NULL,
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
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text,
	"location" text,
	"logo_url" text,
	"cover_url" text,
	"organization_unit_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"join_requires_approval" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "event_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_event_invites_event_user" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "event_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_event_required_forms" PRIMARY KEY("event_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"organization_unit_id" uuid,
	"id_verified_at" timestamp,
	"id_verified_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "membership_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"membership_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_membership_roles_membership_id_role_id" UNIQUE("membership_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo_url" text,
	"website_url" text,
	"contact_email" text,
	"phone" text,
	"description" text,
	"address" text,
	"city" text,
	"zip_code" text,
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
	"cover_url" text,
	"website_url" text,
	"contact_email" text,
	"phone" text,
	"description" text,
	"address" text,
	"city" text,
	"zip_code" text,
	"legal_rep" text,
	"id_verification_enabled" boolean DEFAULT false NOT NULL,
	"required_membership_requirement_profile_id" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_organization_units_organization_id_slug" UNIQUE("organization_id","slug"),
	CONSTRAINT "uq_organization_units_organization_id_id" UNIQUE("organization_id","id"),
	CONSTRAINT "chk_organization_units_not_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id")
);
--> statement-breakpoint
CREATE TABLE "organization_unit_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"organization_unit_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_organization_unit_required_forms" PRIMARY KEY("organization_unit_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "organization_unit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_organization_unit_types_organization_id_name" UNIQUE("organization_id","name")
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_form_blocks_organization_id_title" UNIQUE("organization_id","title")
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
	"document_file_id" uuid,
	"document_label" text,
	"min_age" integer,
	"field_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"form_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submission_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"submission_id" uuid NOT NULL,
	"organization_unit_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_form_submission_shares_submission_unit" UNIQUE("submission_id","organization_unit_id")
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
CREATE TABLE "requirement_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"organization_unit_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"share_token" text NOT NULL UNIQUE,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_requirement_forms_organization_unit_id_name" UNIQUE("organization_unit_id","name")
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
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL UNIQUE,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posthog_distinct_secrets" (
	"slot" text PRIMARY KEY,
	"secret" text NOT NULL,
	"valid_for_date" date NOT NULL,
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
	"image_url" text,
	"visibility" "shift_visibility" DEFAULT 'ALL_MEMBERS'::"shift_visibility" NOT NULL,
	"max_volunteers" integer,
	"min_volunteers" integer,
	"join_requires_approval" boolean DEFAULT false NOT NULL,
	"event_id" uuid,
	"rrule" text,
	"original_starts_at" timestamp NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_call_out_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"sent_by_id" text NOT NULL,
	"status" "shift_call_out_delivery_status" NOT NULL,
	"source" "shift_call_out_source" DEFAULT 'MANUAL'::"shift_call_out_source" NOT NULL,
	"sent_at" timestamp NOT NULL,
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
	"override_min_volunteers" integer,
	"is_exception" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancelled_by_sync" boolean DEFAULT false NOT NULL,
	"occurrence_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_instance_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" NOT NULL,
	"reminded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_sii_instance_user" UNIQUE("instance_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shift_instance_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"shift_instance_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_shift_instance_required_forms" PRIMARY KEY("shift_instance_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "shift_instance_understaffed_states" (
	"instance_id" uuid PRIMARY KEY,
	"last_checked_at" timestamp,
	"call_out_fired_at" timestamp,
	"reminder_fired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shift_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_shift_invites_shift_user" UNIQUE("shift_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shift_manager_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"instance_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"kind" "shift_manager_notification_kind" NOT NULL,
	"status" "shift_call_out_delivery_status" NOT NULL,
	"sent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_shift_required_forms" PRIMARY KEY("shift_id","form_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_digest_shift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"shift_id" uuid NOT NULL,
	"instance_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"send_date" timestamp NOT NULL,
	"accepted_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"storage_key" text NOT NULL UNIQUE,
	"bucket" text NOT NULL,
	"visibility" "file_visibility" NOT NULL,
	"purpose" "file_purpose" NOT NULL,
	"mime_type" text NOT NULL,
	"filename" text NOT NULL,
	"byte_size" integer,
	"status" "file_status" DEFAULT 'pending'::"file_status" NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"organization_unit_id" uuid,
	"public_url" text,
	"uploaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shift_instance_id" uuid,
	"organization_unit_id" uuid NOT NULL,
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
CREATE INDEX "idx_events_org_unit_id" ON "events" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_events_created_by_id" ON "events" ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_events_slug" ON "events" ("slug");--> statement-breakpoint
CREATE INDEX "idx_events_is_deleted" ON "events" ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_event_invites_event_id" ON "event_invites" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_user_id" ON "event_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_event_invites_status" ON "event_invites" ("status");--> statement-breakpoint
CREATE INDEX "idx_memberships_user_id" ON "memberships" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_organization_unit_id" ON "memberships" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_user_id" ON "membership_requests" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_membership_requests_organization_unit_id" ON "membership_requests" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_membership_roles_membership_id" ON "membership_roles" ("membership_id");--> statement-breakpoint
CREATE INDEX "idx_membership_roles_role_id" ON "membership_roles" ("role_id");--> statement-breakpoint
CREATE INDEX "idx_organizations_name" ON "organizations" ("name");--> statement-breakpoint
CREATE INDEX "idx_organizations_deleted_at" ON "organizations" ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_organization_units_organization_id_is_root_true" ON "organization_units" ("organization_id") WHERE "parent_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_organization_units_parent_id" ON "organization_units" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_required_profile_id" ON "organization_units" ("required_membership_requirement_profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_type_id" ON "organization_units" ("type_id");--> statement-breakpoint
CREATE INDEX "idx_organization_units_name" ON "organization_units" ("name");--> statement-breakpoint
CREATE INDEX "idx_organization_units_deleted_at" ON "organization_units" ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_organization_unit_types_organization_id" ON "organization_unit_types" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_unit_types_name" ON "organization_unit_types" ("name");--> statement-breakpoint
CREATE INDEX "idx_documents_user_id" ON "documents" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_form_blocks_organization_id" ON "form_blocks" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_form_blocks_created_by" ON "form_blocks" ("created_by");--> statement-breakpoint
CREATE INDEX "idx_form_block_fields_block_id" ON "form_block_fields" ("block_id");--> statement-breakpoint
CREATE INDEX "idx_form_block_fields_system_key" ON "form_block_fields" ("system_key");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_form_id" ON "form_submissions" ("form_id");--> statement-breakpoint
CREATE INDEX "idx_form_submissions_user_id" ON "form_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_shares_organization_unit_id" ON "form_submission_shares" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_submission_id" ON "form_submission_values" ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_field_id" ON "form_submission_values" ("field_id");--> statement-breakpoint
CREATE INDEX "idx_form_submission_values_block_id" ON "form_submission_values" ("block_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_organization_id" ON "organization_user_profiles" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_user_profiles_user_id" ON "organization_user_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_requirements_organization_id" ON "requirements" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_forms_organization_id" ON "requirement_forms" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_forms_organization_unit_id" ON "requirement_forms" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_forms_share_token" ON "requirement_forms" ("share_token");--> statement-breakpoint
CREATE INDEX "idx_requirement_form_block_refs_form_id" ON "requirement_form_block_refs" ("form_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_form_block_refs_block_id" ON "requirement_form_block_refs" ("block_id");--> statement-breakpoint
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
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_org_unit_id" ON "shifts" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_created_by_id" ON "shifts" ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_event_id" ON "shifts" ("event_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_slug" ON "shifts" ("slug");--> statement-breakpoint
CREATE INDEX "idx_shifts_is_deleted" ON "shifts" ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_scor_instance_id" ON "shift_call_out_recipients" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_scor_recipient_id" ON "shift_call_out_recipients" ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_scor_sent_by_id" ON "shift_call_out_recipients" ("sent_by_id");--> statement-breakpoint
CREATE INDEX "idx_scor_sent_at" ON "shift_call_out_recipients" ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_si_master_id" ON "shift_instances" ("master_id");--> statement-breakpoint
CREATE INDEX "idx_si_actual_starts_at" ON "shift_instances" ("actual_starts_at");--> statement-breakpoint
CREATE INDEX "idx_si_actual_ends_at" ON "shift_instances" ("actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_active_range" ON "shift_instances" ("actual_starts_at","actual_ends_at");--> statement-breakpoint
CREATE INDEX "idx_si_is_exception" ON "shift_instances" ("is_exception");--> statement-breakpoint
CREATE INDEX "idx_si_is_cancelled" ON "shift_instances" ("is_cancelled");--> statement-breakpoint
CREATE INDEX "idx_sii_instance_id" ON "shift_instance_invites" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_sii_user_id" ON "shift_instance_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sii_status" ON "shift_instance_invites" ("status");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_shift_id" ON "shift_invites" ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_user_id" ON "shift_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_status" ON "shift_invites" ("status");--> statement-breakpoint
CREATE INDEX "idx_smn_instance_id" ON "shift_manager_notifications" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_smn_recipient_id" ON "shift_manager_notifications" ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_smn_sent_at" ON "shift_manager_notifications" ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_vdsl_user_id" ON "volunteer_digest_shift_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_vdsl_instance_id" ON "volunteer_digest_shift_logs" ("instance_id");--> statement-breakpoint
CREATE INDEX "idx_vdsl_send_date" ON "volunteer_digest_shift_logs" ("send_date");--> statement-breakpoint
CREATE INDEX "idx_files_uploaded_by_user_id" ON "files" ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_files_organization_unit_id" ON "files" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_files_status" ON "files" ("status");--> statement-breakpoint
CREATE INDEX "idx_time_entries_org_unit_started_at" ON "time_entries" ("organization_unit_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_time_entries_open_per_instance_volunteer" ON "time_entries" ("shift_instance_id","volunteer_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_time_entries_open_shiftless_per_org_volunteer" ON "time_entries" ("organization_unit_id","volunteer_id") WHERE "shift_instance_id" IS NULL AND "ended_at" IS NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_invites" ADD CONSTRAINT "event_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "event_required_forms" ADD CONSTRAINT "event_required_forms_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_required_forms" ADD CONSTRAINT "event_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_id_verified_by_id_users_id_fkey" FOREIGN KEY ("id_verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_JnW42Hb2WNYu_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_reviewed_by_user_id_users_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_memberships_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parent_id_organization_units_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_type_id_organization_unit_types_id_fkey" FOREIGN KEY ("type_id") REFERENCES "organization_unit_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_Wl3widDJ46RJ_fkey" FOREIGN KEY ("required_membership_requirement_profile_id") REFERENCES "requirement_profiles"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "organization_units" ADD CONSTRAINT "fk_organization_units_parent_same_organization" FOREIGN KEY ("organization_id","parent_id") REFERENCES "organization_units"("organization_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_unit_required_forms" ADD CONSTRAINT "organization_unit_required_forms_Hp7pYD82jLLL_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_unit_required_forms" ADD CONSTRAINT "organization_unit_required_forms_twV1Hml42qxX_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization_unit_types" ADD CONSTRAINT "organization_unit_types_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "form_block_fields" ADD CONSTRAINT "form_block_fields_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_block_fields" ADD CONSTRAINT "form_block_fields_document_file_id_files_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_shares" ADD CONSTRAINT "form_submission_shares_submission_id_form_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_shares" ADD CONSTRAINT "form_submission_shares_RxvtuRIVaak7_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_submission_id_form_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_field_id_form_block_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "form_block_fields"("id");--> statement-breakpoint
ALTER TABLE "form_submission_values" ADD CONSTRAINT "form_submission_values_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id");--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_WTRTxwUqszuD_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD CONSTRAINT "organization_user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_WaMssqa2Hv1A_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "requirement_forms" ADD CONSTRAINT "requirement_forms_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "requirement_form_block_refs" ADD CONSTRAINT "requirement_form_block_refs_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "requirement_form_block_refs" ADD CONSTRAINT "requirement_form_block_refs_block_id_form_blocks_id_fkey" FOREIGN KEY ("block_id") REFERENCES "form_blocks"("id") ON DELETE RESTRICT;--> statement-breakpoint
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
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_call_out_recipients" ADD CONSTRAINT "shift_call_out_recipients_sent_by_id_users_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_instances" ADD CONSTRAINT "shift_instances_master_id_shifts_id_fkey" FOREIGN KEY ("master_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD CONSTRAINT "shift_instance_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_instance_required_forms" ADD CONSTRAINT "shift_instance_required_forms_F9ZcBCqsk8fB_fkey" FOREIGN KEY ("shift_instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_instance_required_forms" ADD CONSTRAINT "shift_instance_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_instance_understaffed_states" ADD CONSTRAINT "shift_instance_understaffed_states_BiLthAFNONXn_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_manager_notifications" ADD CONSTRAINT "shift_manager_notifications_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_manager_notifications" ADD CONSTRAINT "shift_manager_notifications_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shift_required_forms" ADD CONSTRAINT "shift_required_forms_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_required_forms" ADD CONSTRAINT "shift_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_instance_id_shift_instances_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "shift_instances"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "volunteer_digest_shift_logs" ADD CONSTRAINT "volunteer_digest_shift_logs_JEmEZNy2ijpb_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_shift_instance_id_shift_instances_id_fkey" FOREIGN KEY ("shift_instance_id") REFERENCES "shift_instances"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE RESTRICT;