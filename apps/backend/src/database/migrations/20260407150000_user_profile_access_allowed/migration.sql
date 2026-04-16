ALTER TABLE "organization_user_profiles" DROP COLUMN "can_access_phone_number";--> statement-breakpoint
ALTER TABLE "organization_user_profiles" DROP COLUMN "can_access_address";--> statement-breakpoint
ALTER TABLE "organization_user_profiles" DROP COLUMN "can_access_bank_account_number";--> statement-breakpoint
ALTER TABLE "organization_user_profiles" ADD COLUMN "user_profile_access_approved" boolean DEFAULT false NOT NULL;
