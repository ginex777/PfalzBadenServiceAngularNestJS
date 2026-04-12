-- AlterTable: add nutzer column to audit_log for user tracking (Option A)
ALTER TABLE "audit_log" ADD COLUMN "nutzer" VARCHAR(100);
