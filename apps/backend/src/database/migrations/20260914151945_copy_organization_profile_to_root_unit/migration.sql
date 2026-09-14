-- Org details are read from organization units (the create gates, the PDF,
-- the overview), but Settings > Organization profile wrote them to the
-- organizations row, where nothing reads them. Settings now writes the root
-- unit; carry over what was already entered there. A value already on the
-- root unit wins, so nothing an admin set on the unit is overwritten.
UPDATE "organization_units" AS "unit"
SET
  "address" = COALESCE(NULLIF(TRIM("unit"."address"), ''), NULLIF(TRIM("org"."address"), ''), "unit"."address"),
  "city" = COALESCE(NULLIF(TRIM("unit"."city"), ''), NULLIF(TRIM("org"."city"), ''), "unit"."city"),
  "zip_code" = COALESCE(NULLIF(TRIM("unit"."zip_code"), ''), NULLIF(TRIM("org"."zip_code"), ''), "unit"."zip_code"),
  "contact_email" = COALESCE(NULLIF(TRIM("unit"."contact_email"), ''), NULLIF(TRIM("org"."contact_email"), ''), "unit"."contact_email"),
  "phone" = COALESCE(NULLIF(TRIM("unit"."phone"), ''), NULLIF(TRIM("org"."phone"), ''), "unit"."phone"),
  "website_url" = COALESCE(NULLIF(TRIM("unit"."website_url"), ''), NULLIF(TRIM("org"."website_url"), ''), "unit"."website_url")
FROM "organizations" AS "org"
WHERE "unit"."organization_id" = "org"."id"
  AND "unit"."parent_id" IS NULL;
