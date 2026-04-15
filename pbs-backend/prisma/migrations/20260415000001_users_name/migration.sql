-- Add first/last name to users
ALTER TABLE "users" ADD COLUMN "vorname" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN "nachname" VARCHAR(100);

-- Add nutzer_name to audit_log for display name
ALTER TABLE "audit_log" ADD COLUMN "nutzer_name" VARCHAR(200);
