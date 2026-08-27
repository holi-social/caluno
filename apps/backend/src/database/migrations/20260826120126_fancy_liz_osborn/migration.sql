CREATE TABLE "reimbursement_manual_baselines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"volunteer_id" text NOT NULL,
	"reimbursement_type_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_by_user_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reimbursement_manual_baselines_volunteer_type_year" ON "reimbursement_manual_baselines" ("volunteer_id","reimbursement_type_id","year");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paid_by_user_id_users_id_fkey" FOREIGN KEY ("paid_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reimbursement_manual_baselines" ADD CONSTRAINT "reimbursement_manual_baselines_2FUj42rkzJU1_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reimbursement_manual_baselines" ADD CONSTRAINT "reimbursement_manual_baselines_volunteer_id_users_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reimbursement_manual_baselines" ADD CONSTRAINT "reimbursement_manual_baselines_UkklTF5FXBMJ_fkey" FOREIGN KEY ("reimbursement_type_id") REFERENCES "reimbursement_types"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "reimbursement_manual_baselines" ADD CONSTRAINT "reimbursement_manual_baselines_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;