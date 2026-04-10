-- CreateTable
CREATE TABLE "kunden" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "strasse" TEXT,
    "ort" TEXT,
    "tel" VARCHAR(50),
    "email" VARCHAR(254),
    "notiz" TEXT,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "kunden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rechnungen" (
    "id" BIGSERIAL NOT NULL,
    "nr" VARCHAR(50) NOT NULL,
    "empf" VARCHAR(200) NOT NULL,
    "str" TEXT,
    "ort" TEXT,
    "titel" TEXT,
    "datum" DATE,
    "leistungsdatum" TEXT,
    "email" VARCHAR(254),
    "zahlungsziel" INTEGER DEFAULT 14,
    "kunden_id" BIGINT,
    "brutto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "frist" DATE,
    "bezahlt" BOOLEAN NOT NULL DEFAULT false,
    "bezahlt_am" DATE,
    "positionen" JSONB NOT NULL DEFAULT '[]',
    "mwst_satz" DECIMAL(5,2) NOT NULL DEFAULT 19,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "rechnungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "angebote" (
    "id" BIGSERIAL NOT NULL,
    "nr" VARCHAR(50) NOT NULL,
    "empf" VARCHAR(200) NOT NULL,
    "str" TEXT,
    "ort" TEXT,
    "titel" TEXT,
    "datum" DATE,
    "brutto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gueltig_bis" DATE,
    "angenommen" BOOLEAN NOT NULL DEFAULT false,
    "abgelehnt" BOOLEAN NOT NULL DEFAULT false,
    "gesendet" BOOLEAN NOT NULL DEFAULT false,
    "zusatz" TEXT,
    "positionen" JSONB NOT NULL DEFAULT '[]',
    "kunden_id" BIGINT,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "angebote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buchhaltung" (
    "id" BIGSERIAL NOT NULL,
    "jahr" INTEGER NOT NULL,
    "monat" INTEGER NOT NULL,
    "typ" VARCHAR(3) NOT NULL,
    "name" TEXT,
    "datum" DATE,
    "brutto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "mwst" DECIMAL(5,2) NOT NULL DEFAULT 19,
    "abzug" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "kategorie" VARCHAR(100),
    "renr" VARCHAR(50),
    "belegnr" VARCHAR(50),
    "beleg_id" BIGINT,

    CONSTRAINT "buchhaltung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vst_paid" (
    "id" BIGSERIAL NOT NULL,
    "jahr" INTEGER NOT NULL,
    "quartal" VARCHAR(10) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "datum" DATE,

    CONSTRAINT "vst_paid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gesperrte_monate" (
    "id" BIGSERIAL NOT NULL,
    "jahr" INTEGER NOT NULL,
    "monat" INTEGER NOT NULL,
    "gesperrt_am" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gesperrte_monate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "person" VARCHAR(200),
    "email" VARCHAR(254) NOT NULL,
    "tel" VARCHAR(50),
    "strasse" TEXT,
    "ort" TEXT,
    "notiz" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'neu',
    "status_notiz" TEXT,
    "datum" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_archive" (
    "id" BIGSERIAL NOT NULL,
    "typ" VARCHAR(50) NOT NULL,
    "referenz_nr" VARCHAR(50) NOT NULL,
    "referenz_id" BIGINT,
    "empf" TEXT,
    "titel" TEXT,
    "datum" DATE,
    "filename" VARCHAR(100) NOT NULL,
    "html_body" TEXT,
    "html_footer" TEXT,
    "erstellt_am" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "objekte" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "strasse" TEXT,
    "plz" VARCHAR(10),
    "ort" VARCHAR(100),
    "notiz" TEXT,
    "filter_typen" TEXT DEFAULT '',
    "vorlage_id" BIGINT,
    "kunden_id" BIGINT,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objekte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muellplan_vorlagen" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "termine" JSONB NOT NULL DEFAULT '[]',
    "pdf_data" BYTEA,
    "pdf_name" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "muellplan_vorlagen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muellplan" (
    "id" BIGSERIAL NOT NULL,
    "objekt_id" BIGINT NOT NULL,
    "muellart" VARCHAR(100) NOT NULL,
    "farbe" VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    "abholung" DATE NOT NULL,
    "erledigt" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "muellplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muellplan_pdf" (
    "id" BIGSERIAL NOT NULL,
    "objekt_id" BIGINT NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "pdf_data" BYTEA NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "muellplan_pdf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitarbeiter" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "rolle" VARCHAR(100),
    "stundenlohn" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "email" VARCHAR(254),
    "tel" VARCHAR(50),
    "notiz" TEXT,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mitarbeiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mitarbeiter_stunden" (
    "id" BIGSERIAL NOT NULL,
    "mitarbeiter_id" BIGINT NOT NULL,
    "datum" DATE NOT NULL,
    "stunden" DECIMAL(6,2) NOT NULL,
    "beschreibung" TEXT,
    "ort" VARCHAR(200),
    "lohn" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "zuschlag" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "zuschlag_typ" VARCHAR(20) DEFAULT '',
    "bezahlt" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mitarbeiter_stunden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hausmeister_einsaetze" (
    "id" BIGSERIAL NOT NULL,
    "mitarbeiter_id" BIGINT,
    "mitarbeiter_name" VARCHAR(200) NOT NULL,
    "kunden_id" BIGINT,
    "kunden_name" VARCHAR(200),
    "datum" DATE NOT NULL,
    "taetigkeiten" JSONB NOT NULL DEFAULT '[]',
    "stunden_gesamt" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "notiz" TEXT,
    "abgeschlossen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hausmeister_einsaetze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "tabelle" VARCHAR(100) NOT NULL,
    "datensatz_id" BIGINT NOT NULL,
    "aktion" VARCHAR(20) NOT NULL,
    "alt_wert" JSONB,
    "neu_wert" JSONB,
    "zeitstempel" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mahnungen" (
    "id" BIGSERIAL NOT NULL,
    "rechnung_id" BIGINT NOT NULL,
    "stufe" INTEGER NOT NULL DEFAULT 1,
    "datum" DATE NOT NULL,
    "betrag_gebuehr" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notiz" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mahnungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiederkehrende_rechnungen" (
    "id" BIGSERIAL NOT NULL,
    "kunden_id" BIGINT,
    "kunden_name" VARCHAR(200),
    "titel" VARCHAR(200) NOT NULL,
    "positionen" JSONB NOT NULL DEFAULT '[]',
    "intervall" VARCHAR(20) NOT NULL DEFAULT 'monatlich',
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "letzte_erstellung" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiederkehrende_rechnungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiederkehrende_ausgaben" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "kategorie" VARCHAR(100) NOT NULL DEFAULT 'Betriebsausgabe',
    "brutto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "mwst" DECIMAL(5,2) NOT NULL DEFAULT 19,
    "abzug" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "belegnr" VARCHAR(50),
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiederkehrende_ausgaben_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benachrichtigungen" (
    "id" BIGSERIAL NOT NULL,
    "typ" VARCHAR(50) NOT NULL,
    "titel" VARCHAR(200) NOT NULL,
    "nachricht" TEXT,
    "link" TEXT,
    "gelesen" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benachrichtigungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" BIGSERIAL NOT NULL,
    "titel" VARCHAR(200) NOT NULL,
    "beschreibung" TEXT,
    "datum" DATE,
    "bearbeiter" VARCHAR(100),
    "kategorie" VARCHAR(100) NOT NULL DEFAULT 'Sonstiges',
    "status" VARCHAR(20) NOT NULL DEFAULT 'todo',
    "prioritaet" VARCHAR(20) NOT NULL DEFAULT 'mittel',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belege" (
    "id" BIGSERIAL NOT NULL,
    "buchhaltung_id" BIGINT,
    "filename" VARCHAR(255) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "filesize" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "typ" VARCHAR(20) NOT NULL DEFAULT 'beleg',
    "notiz" TEXT,
    "aufbewahrung_bis" DATE,
    "erstellt_am" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erstellt_von" VARCHAR(100) NOT NULL DEFAULT 'system',

    CONSTRAINT "belege_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "rechnungen_nr_key" ON "rechnungen"("nr");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "vst_paid_jahr_quartal_key" ON "vst_paid"("jahr", "quartal");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "gesperrte_monate_jahr_monat_key" ON "gesperrte_monate"("jahr", "monat");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "belege_sha256_key" ON "belege"("sha256");

-- AddForeignKey
ALTER TABLE "rechnungen" ADD CONSTRAINT "rechnungen_kunden_id_fkey" FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "angebote" ADD CONSTRAINT "angebote_kunden_id_fkey" FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objekte" ADD CONSTRAINT "objekte_kunden_id_fkey" FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muellplan" ADD CONSTRAINT "muellplan_objekt_id_fkey" FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muellplan_pdf" ADD CONSTRAINT "muellplan_pdf_objekt_id_fkey" FOREIGN KEY ("objekt_id") REFERENCES "objekte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mitarbeiter_stunden" ADD CONSTRAINT "mitarbeiter_stunden_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hausmeister_einsaetze" ADD CONSTRAINT "hausmeister_einsaetze_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hausmeister_einsaetze" ADD CONSTRAINT "hausmeister_einsaetze_kunden_id_fkey" FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mahnungen" ADD CONSTRAINT "mahnungen_rechnung_id_fkey" FOREIGN KEY ("rechnung_id") REFERENCES "rechnungen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiederkehrende_rechnungen" ADD CONSTRAINT "wiederkehrende_rechnungen_kunden_id_fkey" FOREIGN KEY ("kunden_id") REFERENCES "kunden"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "belege" ADD CONSTRAINT "belege_buchhaltung_id_fkey" FOREIGN KEY ("buchhaltung_id") REFERENCES "buchhaltung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
