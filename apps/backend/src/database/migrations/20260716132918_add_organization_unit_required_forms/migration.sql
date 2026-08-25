CREATE TABLE "organization_unit_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"organization_unit_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_organization_unit_required_forms" PRIMARY KEY("organization_unit_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "organization_units" ADD COLUMN "required_forms_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_unit_required_forms" ADD CONSTRAINT "organization_unit_required_forms_Hp7pYD82jLLL_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_unit_required_forms" ADD CONSTRAINT "organization_unit_required_forms_twV1Hml42qxX_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;