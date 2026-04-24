-- 5.4: Aufgaben/Aktivitaeten Backend (Tasks foundation)

DO $$ BEGIN
  CREATE TYPE "TaskType" AS ENUM (
    'MUELL',
    'CHECKLISTE',
    'REINIGUNG',
    'KONTROLLE',
    'REPARATUR',
    'ZEITERFASSUNG',
    'SONSTIGES'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM (
    'OFFEN',
    'IN_BEARBEITUNG',
    'ERLEDIGT',
    'UEBERFAELLIG',
    'GEPRUEFT',
    'ABGELEHNT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "aufgaben" (
  "id" BIGSERIAL PRIMARY KEY,
  "title" VARCHAR(200) NOT NULL,
  "type" "TaskType" NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'OFFEN',
  "object_id" BIGINT NOT NULL,
  "customer_id" BIGINT,
  "user_id" BIGINT,
  "employee_id" BIGINT,
  "due_at" DATE,
  "completed_at" TIMESTAMP,
  "duration_minutes" INTEGER,
  "comment" TEXT,
  "photo_url" VARCHAR(500),
  "muellplan_id" BIGINT UNIQUE,
  "checklist_submission_id" BIGINT UNIQUE,
  "stempel_id" BIGINT UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "aufgaben_object_id_fkey"
    FOREIGN KEY ("object_id") REFERENCES "objekte"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "kunden"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "mitarbeiter"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_muellplan_id_fkey"
    FOREIGN KEY ("muellplan_id") REFERENCES "muellplan"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_checklist_submission_id_fkey"
    FOREIGN KEY ("checklist_submission_id") REFERENCES "checklisten_submissions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "aufgaben_stempel_id_fkey"
    FOREIGN KEY ("stempel_id") REFERENCES "stempel"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "aufgaben_object_id_created_at_idx" ON "aufgaben"("object_id", "created_at");
CREATE INDEX IF NOT EXISTS "aufgaben_customer_id_created_at_idx" ON "aufgaben"("customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "aufgaben_status_idx" ON "aufgaben"("status");
CREATE INDEX IF NOT EXISTS "aufgaben_type_idx" ON "aufgaben"("type");
CREATE INDEX IF NOT EXISTS "aufgaben_due_at_idx" ON "aufgaben"("due_at");

