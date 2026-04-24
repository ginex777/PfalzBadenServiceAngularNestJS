-- 5.1: Objekte Backend Foundation (hausnummer + status)

DO $$ BEGIN
  CREATE TYPE "ObjektStatus" AS ENUM ('AKTIV', 'INAKTIV');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "objekte"
  ADD COLUMN IF NOT EXISTS "hausnummer" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "status" "ObjektStatus" NOT NULL DEFAULT 'AKTIV';

CREATE INDEX IF NOT EXISTS "objekte_kunden_id_idx" ON "objekte"("kunden_id");
CREATE INDEX IF NOT EXISTS "objekte_status_idx" ON "objekte"("status");

