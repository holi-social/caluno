CREATE TABLE "posthog_distinct_secrets" (
	"slot" text PRIMARY KEY,
	"secret" text NOT NULL,
	"valid_for_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
