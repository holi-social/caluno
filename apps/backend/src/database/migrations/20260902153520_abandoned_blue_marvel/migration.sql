ALTER TABLE "events" ADD COLUMN "join_requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "join_requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "event_invites" SET "status" = CASE "status"
  WHEN 'INVITED' THEN 'ADMIN_INVITED'
  WHEN 'ACCEPTED' THEN 'JOINED'
  WHEN 'SELF_JOINED' THEN 'JOINED'
  WHEN 'CANCELLED' THEN 'VOLUNTEER_CANCELLED'
  ELSE "status"
END;--> statement-breakpoint
DROP TYPE "event_invite_status";--> statement-breakpoint
CREATE TYPE "event_invite_status" AS ENUM('ADMIN_INVITED', 'AWAITING_ADMIN_APPROVAL', 'WAITLIST_JOINED', 'JOINED', 'VOLUNTEER_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_REJECTED');--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DATA TYPE "event_invite_status" USING "status"::"event_invite_status";--> statement-breakpoint
ALTER TABLE "event_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"event_invite_status";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
UPDATE "shift_instance_invites" SET "status" = CASE "status"
  WHEN 'INVITED' THEN 'ADMIN_INVITED'
  WHEN 'ACCEPTED' THEN 'JOINED'
  WHEN 'SELF_JOINED' THEN 'JOINED'
  WHEN 'CANCELLED' THEN 'VOLUNTEER_CANCELLED'
  ELSE "status"
END;--> statement-breakpoint
UPDATE "shift_invites" SET "status" = CASE "status"
  WHEN 'INVITED' THEN 'ADMIN_INVITED'
  WHEN 'ACCEPTED' THEN 'JOINED'
  WHEN 'SELF_JOINED' THEN 'JOINED'
  WHEN 'CANCELLED' THEN 'VOLUNTEER_CANCELLED'
  ELSE "status"
END;--> statement-breakpoint
DROP TYPE "shift_invite_status";--> statement-breakpoint
CREATE TYPE "shift_invite_status" AS ENUM('ADMIN_INVITED', 'AWAITING_ADMIN_APPROVAL', 'WAITLIST_JOINED', 'JOINED', 'VOLUNTEER_REJECTED', 'VOLUNTEER_CANCELLED', 'ADMIN_REJECTED');--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_instance_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DATA TYPE "shift_invite_status" USING "status"::"shift_invite_status";--> statement-breakpoint
ALTER TABLE "shift_invites" ALTER COLUMN "status" SET DEFAULT 'ADMIN_INVITED'::"shift_invite_status";
