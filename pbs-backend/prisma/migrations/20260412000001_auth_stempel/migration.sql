-- CreateTable: users (auth)
CREATE TABLE "users" (
    "id"            BIGSERIAL PRIMARY KEY,
    "email"         VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rolle"         VARCHAR(20)  NOT NULL DEFAULT 'admin',
    "aktiv"         BOOLEAN      NOT NULL DEFAULT TRUE,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id"         BIGSERIAL PRIMARY KEY,
    "user_id"    BIGINT       NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateTable: stempel (mobile time tracking)
CREATE TABLE "stempel" (
    "id"             BIGSERIAL PRIMARY KEY,
    "mitarbeiter_id" BIGINT       NOT NULL,
    "start"          TIMESTAMP(3) NOT NULL,
    "stop"           TIMESTAMP(3),
    "dauer_minuten"  INTEGER,
    "notiz"          TEXT,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stempel_mitarbeiter_id_fkey"
        FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
