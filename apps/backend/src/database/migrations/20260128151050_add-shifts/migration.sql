CREATE TABLE "shift_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_shift_assignments_shift_id_user_id" UNIQUE("shift_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_by_id" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_shift_id" ON "shift_assignments" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_shift_assignments_user_id" ON "shift_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_organization_id" ON "shifts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_project_id" ON "shifts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_created_by_id" ON "shifts" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_shifts_starts_at" ON "shifts" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "idx_shifts_ends_at" ON "shifts" USING btree ("ends_at");