CREATE TYPE "membership_request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "membership_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "membership_request_status" DEFAULT 'PENDING'::"membership_request_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_memberships_requests_email_organization_id" UNIQUE("email","organization_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_membership_requests_email" ON "membership_requests" ("email");--> statement-breakpoint
CREATE INDEX "idx_memberships_requests_organization_id" ON "membership_requests" ("organization_id");--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;