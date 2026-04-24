-- Operativ: Checklisten & Kontrollen (Templates + Submissions)

CREATE TABLE IF NOT EXISTS "checklisten_templates" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "fields" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "checklisten_submissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "template_id" BIGINT NOT NULL,
  "objekt_id" BIGINT NOT NULL,
  "mitarbeiter_id" BIGINT,
  "created_by_email" VARCHAR(254) NOT NULL,
  "created_by_name" VARCHAR(200),
  "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "template_snapshot" JSONB NOT NULL,
  "answers" JSONB NOT NULL,
  "note" TEXT,
  CONSTRAINT "checklisten_submissions_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "checklisten_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "checklisten_submissions_objekt_id_fkey"
    FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "checklisten_submissions_mitarbeiter_id_fkey"
    FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "checklisten_submissions_objekt_id_submitted_at_idx"
  ON "checklisten_submissions"("objekt_id", "submitted_at");
CREATE INDEX IF NOT EXISTS "checklisten_submissions_template_id_submitted_at_idx"
  ON "checklisten_submissions"("template_id", "submitted_at");
CREATE INDEX IF NOT EXISTS "checklisten_submissions_mitarbeiter_id_submitted_at_idx"
  ON "checklisten_submissions"("mitarbeiter_id", "submitted_at");

