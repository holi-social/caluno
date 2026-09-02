CREATE TABLE "shift_required_forms" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid,
	"form_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pk_shift_required_forms" PRIMARY KEY("shift_id","form_id")
);
--> statement-breakpoint
ALTER TABLE "shift_required_forms" ADD CONSTRAINT "shift_required_forms_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_required_forms" ADD CONSTRAINT "shift_required_forms_form_id_requirement_forms_id_fkey" FOREIGN KEY ("form_id") REFERENCES "requirement_forms"("id") ON DELETE RESTRICT;