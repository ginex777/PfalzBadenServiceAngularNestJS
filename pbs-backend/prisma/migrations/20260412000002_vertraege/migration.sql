-- CreateTable: vertraege
CREATE TABLE "vertraege" (
    "id"              BIGSERIAL PRIMARY KEY,
    "kunden_id"       BIGINT,
    "kunden_name"     VARCHAR(200) NOT NULL,
    "kunden_strasse"  VARCHAR(200),
    "kunden_ort"      VARCHAR(200),
    "vorlage"         VARCHAR(50)  NOT NULL,
    "titel"           VARCHAR(200) NOT NULL,
    "vertragsbeginn"  DATE         NOT NULL,
    "laufzeit_monate" INTEGER      NOT NULL DEFAULT 12,
    "monatliche_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "leistungsumfang" TEXT,
    "kuendigungsfrist" INTEGER     NOT NULL DEFAULT 3,
    "pdf_filename"    VARCHAR(200),
    "html_body"       TEXT,
    "status"          VARCHAR(20)  NOT NULL DEFAULT 'aktiv',
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vertraege_kunden_id_fkey"
        FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);
