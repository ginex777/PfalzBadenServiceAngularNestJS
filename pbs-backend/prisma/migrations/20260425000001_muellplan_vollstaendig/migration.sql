-- AlterTable: add beschreibung, aktiv, user_id to muellplan
ALTER TABLE "muellplan" ADD COLUMN "beschreibung" VARCHAR(500);
ALTER TABLE "muellplan" ADD COLUMN "aktiv" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "muellplan" ADD COLUMN "user_id" BIGINT;

-- AddForeignKey
ALTER TABLE "muellplan" ADD CONSTRAINT "muellplan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
