UPDATE "time_entries" te
SET "organization_unit_id" = s."organization_unit_id"
FROM "shift_instances" si
JOIN "shifts" s ON s."id" = si."master_id"
WHERE te."shift_instance_id" = si."id"
  AND te."organization_unit_id" IS NULL;