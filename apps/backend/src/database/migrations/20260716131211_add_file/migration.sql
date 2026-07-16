CREATE TYPE "file_purpose" AS ENUM('requirement_document', 'form_document', 'org_logo', 'organization_logo', 'event_image', 'shift_image', 'profile_picture');--> statement-breakpoint
CREATE TYPE "file_status" AS ENUM('pending', 'uploaded', 'failed');--> statement-breakpoint
CREATE TYPE "file_visibility" AS ENUM('private', 'public');--> statement-breakpoint
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
ALTER TABLE "form_block_fields" ADD COLUMN "document_file_id" uuid;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "form_block_fields" DROP COLUMN "document_url";--> statement-breakpoint
CREATE INDEX "idx_files_uploaded_by_user_id" ON "files" ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_files_organization_unit_id" ON "files" ("organization_unit_id");--> statement-breakpoint
CREATE INDEX "idx_files_status" ON "files" ("status");--> statement-breakpoint
ALTER TABLE "form_block_fields" ADD CONSTRAINT "form_block_fields_document_file_id_files_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "files"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_unit_id_organization_units_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL;