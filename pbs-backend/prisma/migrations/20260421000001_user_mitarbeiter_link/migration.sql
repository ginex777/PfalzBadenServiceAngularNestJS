-- Option A user<->mitarbeiter link: nullable 1:1 FK on mitarbeiter
ALTER TABLE "mitarbeiter" ADD COLUMN "user_id" BIGINT;

-- Backfill by normalized email. If duplicates exist on mitarbeiter side,
-- only the first row per user is linked; remaining rows stay orphaned (user_id NULL).
WITH kandidaten AS (
  SELECT
    m.id AS mitarbeiter_id,
    u.id AS user_id,
    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY m.id) AS rn
  FROM "mitarbeiter" m
  JOIN "users" u
    ON LOWER(TRIM(m.email)) = LOWER(TRIM(u.email))
  WHERE m.email IS NOT NULL
    AND TRIM(m.email) <> ''
    AND m.user_id IS NULL
)
UPDATE "mitarbeiter" m
SET "user_id" = k.user_id
FROM kandidaten k
WHERE m.id = k.mitarbeiter_id
  AND k.rn = 1;

-- Enforce 1:1 relation while still allowing unlinked/orphan records.
CREATE UNIQUE INDEX "mitarbeiter_user_id_key" ON "mitarbeiter"("user_id");

ALTER TABLE "mitarbeiter"
  ADD CONSTRAINT "mitarbeiter_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
