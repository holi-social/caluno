CREATE TYPE "public"."shift_invite_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "shift_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "shift_invite_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_shift_invites_shift_id_user_id" UNIQUE("shift_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_invites" ADD CONSTRAINT "shift_invites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shift_invites_shift_id" ON "shift_invites" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_user_id" ON "shift_invites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_status" ON "shift_invites" USING btree ("status");