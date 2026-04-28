-- DropForeignKey
ALTER TABLE "aufgaben" DROP CONSTRAINT "aufgaben_checklist_submission_id_fkey";

-- DropForeignKey
ALTER TABLE "aufgaben" DROP CONSTRAINT "aufgaben_muellplan_id_fkey";

-- DropForeignKey
ALTER TABLE "aufgaben" DROP CONSTRAINT "aufgaben_stempel_id_fkey";

-- AlterTable
ALTER TABLE "aufgaben" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "checklisten_submissions" ALTER COLUMN "submitted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "checklisten_templates" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "stempel" ADD COLUMN     "objekt_id" BIGINT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vertraege" ALTER COLUMN "kunden_strasse" SET DATA TYPE TEXT,
ALTER COLUMN "kunden_ort" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "nachweise" (
    "id" BIGSERIAL NOT NULL,
    "objekt_id" BIGINT NOT NULL,
    "mitarbeiter_id" BIGINT,
    "filename" VARCHAR(255) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "filesize" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "notiz" TEXT,
    "erstellt_am" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erstellt_von" VARCHAR(100) NOT NULL DEFAULT 'system',
    "erstellt_von_name" VARCHAR(200),

    CONSTRAINT "nachweise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nachweise_sha256_key" ON "nachweise"("sha256");

-- CreateIndex
CREATE INDEX "nachweise_objekt_id_erstellt_am_idx" ON "nachweise"("objekt_id", "erstellt_am");

-- AddForeignKey
ALTER TABLE "stempel" ADD CONSTRAINT "stempel_objekt_id_fkey" FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nachweise" ADD CONSTRAINT "nachweise_objekt_id_fkey" FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nachweise" ADD CONSTRAINT "nachweise_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
