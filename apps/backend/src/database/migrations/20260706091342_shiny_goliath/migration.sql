CREATE TABLE "shift_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"shift_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" DEFAULT 'PENDING'::"shift_invite_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_shift_invites_shift_user" UNIQUE("shift_id","user_id")
);
--> statement-breakpoint
CREATE INDEX "idx_shift_invites_shift_id" ON "shift_invites" ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_user_id" ON "shift_invites" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_status" ON "shift_invites" ("status");--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_shift_id_shifts_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;