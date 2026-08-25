CREATE TYPE "invite_origin" AS ENUM('ADMIN_INVITED', 'VOLUNTEER_JOINED', 'VOLUNTEER_APPLIED');--> statement-breakpoint
ALTER TABLE "event_invites" ADD COLUMN "origin" "invite_origin";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ADD COLUMN "origin" "invite_origin";--> statement-breakpoint
ALTER TABLE "shift_invites" ADD COLUMN "origin" "invite_origin";--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "event_invites" SET "origin" = 'ADMIN_INVITED', "status" = NULL WHERE "status" = 'INVITED';--> statement-breakpoint
UPDATE "event_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_ACCEPTED' WHERE "status" = 'ACCEPTED';--> statement-breakpoint
UPDATE "event_invites" SET "origin" = 'VOLUNTEER_JOINED', "status" = NULL WHERE "status" = 'SELF_JOINED';--> statement-breakpoint
UPDATE "event_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'VOLUNTEER_REJECTED';--> statement-breakpoint
UPDATE "event_invites" SET "origin" = NULL, "status" = 'ADMIN_REJECTED' WHERE "status" = 'ADMIN_REJECTED';--> statement-breakpoint
UPDATE "event_invites" SET "origin" = NULL, "status" = 'VOLUNTEER_CANCELLED' WHERE "status" = 'CANCELLED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = 'ADMIN_INVITED', "status" = NULL WHERE "status" = 'INVITED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_ACCEPTED' WHERE "status" = 'ACCEPTED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = 'VOLUNTEER_JOINED', "status" = NULL WHERE "status" = 'SELF_JOINED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'VOLUNTEER_REJECTED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = NULL, "status" = 'ADMIN_REJECTED' WHERE "status" = 'ADMIN_REJECTED';--> statement-breakpoint
UPDATE "shift_instance_invites" SET "origin" = NULL, "status" = 'VOLUNTEER_CANCELLED' WHERE "status" = 'CANCELLED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = 'ADMIN_INVITED', "status" = NULL WHERE "status" = 'INVITED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_ACCEPTED' WHERE "status" = 'ACCEPTED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = 'VOLUNTEER_JOINED', "status" = NULL WHERE "status" = 'SELF_JOINED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = 'ADMIN_INVITED', "status" = 'VOLUNTEER_REJECTED' WHERE "status" = 'VOLUNTEER_REJECTED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = NULL, "status" = 'ADMIN_REJECTED' WHERE "status" = 'ADMIN_REJECTED';--> statement-breakpoint
UPDATE "shift_invites" SET "origin" = NULL, "status" = 'VOLUNTEER_CANCELLED' WHERE "status" = 'CANCELLED';--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
DROP TYPE "event_invite_status";--> statement-breakpoint
CREATE TYPE "event_invite_status" AS ENUM('VOLUNTEER_ACCEPTED', 'VOLUNTEER_REJECTED', 'ADMIN_ACCEPTED', 'ADMIN_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_CANCELLED');--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE "event_invite_status" USING "status"::"event_invite_status";--> statement-breakpoint
DROP TYPE "shift_invite_status";--> statement-breakpoint
CREATE TYPE "shift_invite_status" AS ENUM('VOLUNTEER_ACCEPTED', 'VOLUNTEER_REJECTED', 'ADMIN_ACCEPTED', 'ADMIN_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_CANCELLED');--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
CREATE INDEX "idx_event_invites_origin" ON "event_invites" ("origin");--> statement-breakpoint
CREATE INDEX "idx_sii_origin" ON "shift_instance_invites" ("origin");--> statement-breakpoint
CREATE INDEX "idx_shift_invites_origin" ON "shift_invites" ("origin");
