ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" VARCHAR(36) NOT NULL DEFAULT gen_random_uuid()::text;
CREATE INDEX "refresh_tokens_user_id_family_id_idx" ON "refresh_tokens"("user_id", "family_id");
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" DROP DEFAULT;
