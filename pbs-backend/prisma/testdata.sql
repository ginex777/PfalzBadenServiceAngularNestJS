-- =============================================================================
-- PBS TEST DATA
-- Clears all data and inserts realistic test data for full-app verification.
--
-- Passwords:
--   admin@pbs-service.de        → Test1234!
--   thomas.mueller@pbs-service.de → Test1234!
--   anna.schmidt@pbs-service.de → Mitarbeiter1!
--
-- Run with:
--   docker exec -i pbs-db psql -U pbs -d pbs < pbs-backend/prisma/testdata.sql
-- =============================================================================

BEGIN;

-- ── Clear all tables (CASCADE handles FK order) ──────────────────────────────
TRUNCATE TABLE
  refresh_tokens,
  audit_log,
  benachrichtigungen,
  pdf_archive,
  mahnungen,
  belege,
  buchhaltung,
  checklisten_submissions,
  checklisten_template_objekte,
  checklisten_templates,
  nachweise,
  stempel,
  mitarbeiter_stunden,
  hausmeister_einsaetze,
  muellplan,
  muellplan_pdf,
  aufgaben,
  wiederkehrende_rechnungen,
  vertraege,
  angebote,
  rechnungen,
  objekte,
  mitarbeiter,
  users,
  kunden,
  muellplan_vorlagen,
  vst_paid,
  gesperrte_monate,
  settings,
  wiederkehrende_ausgaben
  RESTART IDENTITY CASCADE;

-- ── Users ─────────────────────────────────────────────────────────────────────
-- Passwords hashed with bcrypt, 12 rounds
INSERT INTO users (email, password_hash, rolle, vorname, nachname, aktiv, created_at, updated_at) VALUES
  ('admin@pbs-service.de',          '$2b$12$Y0Nkn5Gj5TBhEAP2IubMYuZrORqPtdleK5VihPE8RD71Bklxoo5xe', 'admin',       'Dennis',  'Admin',    true, NOW(), NOW()),
  ('thomas.mueller@pbs-service.de', '$2b$12$Y0Nkn5Gj5TBhEAP2IubMYuZrORqPtdleK5VihPE8RD71Bklxoo5xe', 'mitarbeiter', 'Thomas',  'Müller',   true, NOW(), NOW()),
  ('anna.schmidt@pbs-service.de',   '$2b$12$ZqaQrCYALtcQ4jTxV9ojTe/mLblsWloqheYR2xopYS3R7Dy7VLz9u', 'mitarbeiter', 'Anna',    'Schmidt',  true, NOW(), NOW());

-- ── Kunden ────────────────────────────────────────────────────────────────────
INSERT INTO kunden (name, strasse, ort, tel, email, notiz, created_at) VALUES
  ('Muster Immobilien GmbH',         'Hauptstraße 42',         'München',    '089-123456',    'kontakt@muster-immo.de',      'Großkunde – 3 Objekte, monatliche Abrechnung',             NOW()),
  ('Familie Bergmann',               'Rosenweg 7',             'Augsburg',   '0821-987654',   'h.bergmann@privatmail.de',    'Privatkunde – sehr zuverlässig, zahlt pünktlich',           NOW()),
  ('Gewerbepark Süd GmbH & Co. KG',  'Industriestraße 120',   'Ingolstadt', '0841-556677',   'verwaltung@gewerbepark-sued.de', 'Gewerbeobjekte – Rechnungsempfänger ist die Verwaltung', NOW());

-- ── Mitarbeiter ───────────────────────────────────────────────────────────────
INSERT INTO mitarbeiter (user_id, name, rolle, stundenlohn, email, tel, aktiv, created_at) VALUES
  (2, 'Thomas Müller',  'Hausmeister',  18.50, 'thomas.mueller@pbs-service.de', '0170-1234567', true, NOW()),
  (3, 'Anna Schmidt',   'Reinigungskraft', 15.00, 'anna.schmidt@pbs-service.de', '0171-9876543', true, NOW());

-- ── Objekte ───────────────────────────────────────────────────────────────────
INSERT INTO objekte (name, strasse, hausnummer, plz, ort, notiz, status, filter_typen, kunden_id, created_at) VALUES
  ('Wohnanlage Rosenweg',            'Rosenweg',         '12-18',  '80333', 'München',    '24 Wohneinheiten, Tiefgarage, Aufzug',           'AKTIV', '', 1, NOW()),
  ('Mehrfamilienhaus Lindenstraße',  'Lindenstraße',     '5',      '80469', 'München',    '8 Wohneinheiten, Baujahr 1985',                  'AKTIV', '', 1, NOW()),
  ('Einfamilienhaus Bergmann',       'Rosenweg',         '7',      '86150', 'Augsburg',   'Einfamilienhaus mit Garten, Keller',             'AKTIV', '', 2, NOW()),
  ('Bürogebäude Block A',            'Industriestraße',  '120a',   '85049', 'Ingolstadt', '4 Etagen, 32 Büros, Konferenzräume, Tiefgarage', 'AKTIV', '', 3, NOW()),
  ('Lager & Logistik Halle B',       'Industriestraße',  '120b',   '85049', 'Ingolstadt', 'Lagerhalle 1200qm, Verladerampen',               'AKTIV', '', 3, NOW());

-- ── MuellplanVorlagen ─────────────────────────────────────────────────────────
INSERT INTO muellplan_vorlagen (name, termine, created_at) VALUES
  ('Standard Wohnanlage',
   '[
     {"muellart": "Restmüll",    "farbe": "#6b7280", "wochentag": 2, "intervall": "zweiwöchentlich"},
     {"muellart": "Biomüll",     "farbe": "#16a34a", "wochentag": 2, "intervall": "wöchentlich"},
     {"muellart": "Papiertonne", "farbe": "#2563eb", "wochentag": 4, "intervall": "vierwöchentlich"},
     {"muellart": "Gelbe Tonne", "farbe": "#ca8a04", "wochentag": 4, "intervall": "zweiwöchentlich"}
   ]',
   NOW());

-- ── Muellplan ─────────────────────────────────────────────────────────────────
-- Objekt 1: Wohnanlage Rosenweg
INSERT INTO muellplan (objekt_id, muellart, farbe, abholung, erledigt, beschreibung, aktiv, user_id, created_at) VALUES
  (1, 'Restmüll',       '#6b7280', '2026-04-28', false, 'Tonne 1-4 rausstellen',   true, 1, NOW()),
  (1, 'Biomüll',        '#16a34a', '2026-04-29', false, 'Biotonne bereitstellen',  true, 1, NOW()),
  (1, 'Papiertonne',    '#2563eb', '2026-05-05', false, NULL,                      true, 1, NOW()),
  (1, 'Gelbe Tonne',    '#ca8a04', '2026-05-06', false, NULL,                      true, 1, NOW()),
  (1, 'Restmüll',       '#6b7280', '2026-04-14', true,  'Erledigt durch Müller',   true, 2, NOW()),
  (1, 'Sperrmüll',      '#dc2626', '2026-05-15', false, 'Sperrmüllabholung Keller',true, 1, NOW()),
-- Objekt 2: Mehrfamilienhaus Lindenstraße
  (2, 'Restmüll',       '#6b7280', '2026-04-29', false, NULL,                      true, 1, NOW()),
  (2, 'Biomüll',        '#16a34a', '2026-04-29', false, NULL,                      true, 1, NOW()),
  (2, 'Papiertonne',    '#2563eb', '2026-05-07', false, NULL,                      true, 1, NOW()),
-- Objekt 4: Bürogebäude
  (4, 'Restmüll',       '#6b7280', '2026-04-28', false, '6 Tonnen gesamt',         true, 1, NOW()),
  (4, 'Papiertonne',    '#2563eb', '2026-05-05', false, '4 Papiertonnen',          true, 1, NOW()),
  (4, 'Gelbe Tonne',    '#ca8a04', '2026-04-21', true,  NULL,                      true, 2, NOW());

-- ── Rechnungen ───────────────────────────────────────────────────────────────
INSERT INTO rechnungen (nr, empf, str, ort, titel, datum, leistungsdatum, email, zahlungsziel, kunden_id, brutto, frist, bezahlt, bezahlt_am, positionen, mwst_satz, created_at) VALUES
  ('RE-2026-001',
   'Muster Immobilien GmbH',
   'Hauptstraße 42',
   '80333 München',
   'Hausmeisterservice März 2026',
   '2026-03-31',
   'März 2026',
   'kontakt@muster-immo.de',
   14,
   1,
   1547.30,
   '2026-04-14',
   true,
   '2026-04-10',
   '[{"bez":"Hausmeisterdienste 80 Std.","stunden":80,"einzelpreis":15.50,"gesamtpreis":1240.00},{"bez":"Materialkosten pauschal","gesamtpreis":60.75},{"bez":"Winterdienst Notfalleinsatz","stunden":8,"einzelpreis":22.00,"gesamtpreis":176.00}]',
   19,
   NOW()),

  ('RE-2026-002',
   'Gewerbepark Süd GmbH & Co. KG',
   'Industriestraße 120',
   '85049 Ingolstadt',
   'Gebäudereinigung April 2026',
   '2026-04-01',
   'April 2026',
   'verwaltung@gewerbepark-sued.de',
   14,
   3,
   2380.00,
   '2026-04-15',
   false,
   NULL,
   '[{"bez":"Unterhaltsreinigung Block A – 40h","stunden":40,"einzelpreis":18.00,"gesamtpreis":720.00},{"bez":"Unterhaltsreinigung Halle B – 20h","stunden":20,"einzelpreis":15.00,"gesamtpreis":300.00},{"bez":"Glasreinigung Fassade pauschal","gesamtpreis":560.00},{"bez":"Verbrauchsmaterial","gesamtpreis":420.00}]',
   19,
   NOW()),

  ('RE-2026-003',
   'Familie Bergmann',
   'Rosenweg 7',
   '86150 Augsburg',
   'Gartenservice Februar 2026',
   '2026-02-28',
   'Februar 2026',
   'h.bergmann@privatmail.de',
   14,
   2,
   297.50,
   '2026-03-14',
   false,
   NULL,
   '[{"bez":"Gartenpflege 10 Std.","stunden":10,"einzelpreis":22.00,"gesamtpreis":220.00},{"bez":"Heckenschnitt","gesamtpreis":60.00},{"bez":"Entsorgung Grünschnitt","gesamtpreis":17.50}]',
   19,
   NOW());

-- ── Mahnungen (für überfällige Rechnung RE-2026-003) ─────────────────────────
INSERT INTO mahnungen (rechnung_id, stufe, datum, betrag_gebuehr, notiz, created_at) VALUES
  (3, 1, '2026-03-20', 5.00, '1. Mahnung – Zahlungserinnerung', NOW());

-- ── Angebote ─────────────────────────────────────────────────────────────────
INSERT INTO angebote (nr, empf, str, ort, titel, datum, brutto, gueltig_bis, angenommen, abgelehnt, gesendet, positionen, kunden_id, created_at) VALUES
  ('AN-2026-001',
   'Muster Immobilien GmbH',
   'Hauptstraße 42',
   '80333 München',
   'Jahresvertrag Hausmeisterservice 2026/2027',
   '2026-04-01',
   18564.00,
   '2026-05-01',
   true,
   false,
   true,
   '[{"bez":"Monatliche Hausmeisterpauschale","gesamtpreis":1200.00},{"bez":"Winterdienst Saison pauschal","gesamtpreis":1800.00},{"bez":"Notfalldienst 10x pauschal","gesamtpreis":564.00}]',
   1,
   NOW()),

  ('AN-2026-002',
   'Gewerbepark Süd GmbH & Co. KG',
   'Industriestraße 120',
   '85049 Ingolstadt',
   'Erweiterung Reinigungsvertrag Halle C',
   '2026-04-15',
   3570.00,
   '2026-05-15',
   false,
   false,
   true,
   '[{"bez":"Unterhaltsreinigung Halle C monatlich","gesamtpreis":2800.00},{"bez":"Einmalige Grundreinigung Halle C","gesamtpreis":770.00}]',
   3,
   NOW());

-- ── Buchhaltung ───────────────────────────────────────────────────────────────
INSERT INTO buchhaltung (jahr, monat, typ, name, datum, brutto, mwst, abzug, kategorie, renr) VALUES
  (2026, 3,  'EIN', 'Muster Immobilien GmbH – RE-2026-001', '2026-04-10', 1547.30, 19, 100, 'Hausmeisterservice',  'RE-2026-001'),
  (2026, 4,  'AUS', 'Reinigungsmittel Nachschub',           '2026-04-05', 128.50,  19, 100, 'Betriebsmaterial',    NULL),
  (2026, 4,  'AUS', 'Kraftstoff Dienstfahrzeug',            '2026-04-12', 87.20,   19, 100, 'Fahrzeugkosten',      NULL),
  (2026, 4,  'AUS', 'Arbeitsschutzkleidung',                '2026-04-18', 214.80,  19, 100, 'Betriebsausgabe',     NULL);

-- ── MitarbeiterStunden ────────────────────────────────────────────────────────
INSERT INTO mitarbeiter_stunden (mitarbeiter_id, datum, stunden, beschreibung, ort, lohn, zuschlag, zuschlag_typ, bezahlt) VALUES
  (1, '2026-04-22', 8.00, 'Hausmeisterdienst Rosenweg',           'München',    148.00, 0,     '',        true),
  (1, '2026-04-23', 6.50, 'Reparatur Aufzug Lindenstraße',        'München',    120.25, 22.00, 'Notfall', true),
  (2, '2026-04-22', 7.00, 'Unterhaltsreinigung Bürogebäude',      'Ingolstadt', 105.00, 0,     '',        true),
  (1, '2026-04-24', 8.00, 'Gartenpflege + Müllbereich Rosenweg',  'München',    148.00, 0,     '',        false),
  (2, '2026-04-24', 5.00, 'Glasreinigung Fassade Block A',        'Ingolstadt',  75.00, 0,     '',        false);

-- ── Stempel ───────────────────────────────────────────────────────────────────
INSERT INTO stempel (mitarbeiter_id, objekt_id, start, stop, dauer_minuten, notiz) VALUES
  (1, 1, '2026-04-27 07:30:00', '2026-04-27 15:45:00', 495, 'Regulärer Hausmeistertag'),
  (2, 4, '2026-04-27 08:00:00', '2026-04-27 13:00:00', 300, 'Büroreinigung Block A');

-- ── HausmeisterEinsaetze ──────────────────────────────────────────────────────
INSERT INTO hausmeister_einsaetze (mitarbeiter_id, mitarbeiter_name, kunden_id, kunden_name, datum, taetigkeiten, stunden_gesamt, notiz, abgeschlossen) VALUES
  (1, 'Thomas Müller', 1, 'Muster Immobilien GmbH', '2026-04-22',
   '[{"beschreibung":"Treppenhausreinigung","dauer":2},{"beschreibung":"Mülltonnen bereitstellen","dauer":0.5},{"beschreibung":"Glühbirne Keller tauschen","dauer":0.25}]',
   2.75, NULL, true),
  (1, 'Thomas Müller', 1, 'Muster Immobilien GmbH', '2026-04-23',
   '[{"beschreibung":"Aufzugstechniker begleiten","dauer":1.5},{"beschreibung":"Protokoll Aufzugswartung","dauer":0.5},{"beschreibung":"Außenanlage kontrollieren","dauer":1}]',
   3.00, 'Aufzug wieder in Betrieb', true);

-- ── Checklisten Templates ─────────────────────────────────────────────────────
INSERT INTO checklisten_templates (name, description, kategorie, version, fields, is_active, created_at, updated_at) VALUES
  ('Wöchentliche Hausbegehung',
   'Standardcheckliste für die wöchentliche Inspektion von Wohnanlagen',
   'Inspektion',
   1,
   '[
     {"id":"f1","label":"Treppenhaus sauber","type":"checkbox","required":true},
     {"id":"f2","label":"Briefkastenanlage in Ordnung","type":"checkbox","required":true},
     {"id":"f3","label":"Außenbeleuchtung funktionsfähig","type":"checkbox","required":true},
     {"id":"f4","label":"Mülltonnenbereich aufgeräumt","type":"checkbox","required":true},
     {"id":"f5","label":"Keller und Technikraum zugänglich","type":"checkbox","required":false},
     {"id":"f6","label":"Schäden oder Besonderheiten","type":"text","required":false}
   ]',
   true,
   NOW(),
   NOW());

-- ── Checklisten Template Objekte ──────────────────────────────────────────────
INSERT INTO checklisten_template_objekte (template_id, objekt_id) VALUES
  (1, 1),
  (1, 2);

-- ── Checklisten Submissions ───────────────────────────────────────────────────
INSERT INTO checklisten_submissions
  (template_id, objekt_id, mitarbeiter_id, created_by_email, created_by_name, submitted_at, template_snapshot, answers, note)
VALUES
  (1, 1, 1,
   'thomas.mueller@pbs-service.de',
   'Thomas Müller',
   '2026-04-22 09:15:00',
   '{"id":1,"name":"Wöchentliche Hausbegehung","version":1}',
   '{"f1":true,"f2":true,"f3":true,"f4":true,"f5":true,"f6":"Kellertür Schloss klemmt leicht, bitte beobachten"}',
   'Alles in Ordnung bis auf Kellertür');

-- ── Tasks / Aufgaben ──────────────────────────────────────────────────────────
INSERT INTO aufgaben (title, type, status, object_id, customer_id, user_id, employee_id, due_at, comment, created_at, updated_at) VALUES
  ('Mülltonnen Rosenweg bereitstellen',     'MUELL',       'OFFEN',        1, 1, 1, 1, '2026-04-28', NULL,                                      NOW(), NOW()),
  ('Wöchentliche Hausbegehung Rosenweg',    'KONTROLLE',   'OFFEN',        1, 1, 1, 1, '2026-04-29', NULL,                                      NOW(), NOW()),
  ('Aufzugswartung Lindenstraße',           'REPARATUR',   'IN_BEARBEITUNG',2, 1, 1, 1, '2026-04-30', 'Techniker Termin am 30.04. um 10 Uhr',   NOW(), NOW()),
  ('Glasreinigung Fassade Block A',         'REINIGUNG',   'ERLEDIGT',     4, 3, 3, 2, '2026-04-24', 'Abgeschlossen, Fotos gemacht',            NOW(), NOW()),
  ('Grundreinigung nach Mieterwechsel',     'REINIGUNG',   'OFFEN',        2, 1, NULL, 2, '2026-05-03', 'Wohnung 3. OG links',                  NOW(), NOW());

-- ── Wiederkehrende Rechnungen ─────────────────────────────────────────────────
INSERT INTO wiederkehrende_rechnungen (kunden_id, kunden_name, titel, positionen, intervall, aktiv, letzte_erstellung) VALUES
  (1, 'Muster Immobilien GmbH',
   'Hausmeisterservice monatlich',
   '[{"bez":"Hausmeisterpauschale monatlich","gesamtpreis":1200.00}]',
   'monatlich',
   true,
   '2026-03-31');

-- ── Vertraege ─────────────────────────────────────────────────────────────────
INSERT INTO vertraege (kunden_id, kunden_name, kunden_strasse, kunden_ort, vorlage, titel, vertragsbeginn, laufzeit_monate, monatliche_rate, leistungsumfang, kuendigungsfrist, status, created_at, updated_at) VALUES
  (1,
   'Muster Immobilien GmbH',
   'Hauptstraße 42',
   '80333 München',
   'hausmeister',
   'Hausmeisterdienstleistungsvertrag 2026',
   '2026-01-01',
   24,
   1200.00,
   'Monatliche Hausmeisterdienste für Wohnanlage Rosenweg und Mehrfamilienhaus Lindenstraße inkl. Winterdienst und Notfalldienst.',
   3,
   'aktiv',
   NOW(),
   NOW());

-- ── Settings ──────────────────────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
  ('firma', '{"name":"PBS Service GmbH","strasse":"Musterstraße 1","ort":"80331 München","tel":"089-999999","email":"info@pbs-service.de","ust_id":"DE123456789","steuernummer":"123/456/78900","bank_name":"Musterbank","iban":"DE12345678901234567890","bic":"MUSTBIC1"}')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── Wiederkehrende Ausgaben ───────────────────────────────────────────────────
INSERT INTO wiederkehrende_ausgaben (name, kategorie, brutto, mwst, abzug, aktiv) VALUES
  ('Fahrzeugversicherung Transporter',  'Fahrzeugkosten',   89.50,  19, 100, true),
  ('Werkzeugversicherung',              'Betriebsausgabe',  34.00,  19, 100, true),
  ('Buchhaltungssoftware Lizenz',       'Bürokosten',       49.00,  19, 100, true),
  ('Berufsgenossenschaft Beitrag',      'Versicherung',    215.00,   0, 100, true);

-- ── VstPaid ───────────────────────────────────────────────────────────────────
INSERT INTO vst_paid (jahr, quartal, paid, datum) VALUES
  (2026, 'Q1', true, '2026-04-10');

-- ── Benachrichtigungen ────────────────────────────────────────────────────────
INSERT INTO benachrichtigungen (typ, titel, nachricht, link, gelesen, erstellt_am) VALUES
  ('mahnung',   'Mahnung versendet',             'RE-2026-003 an Familie Bergmann wurde gemahnt.',          '/rechnungen',  false, NOW()),
  ('aufgabe',   'Neue Aufgabe fällig',           'Aufzugswartung Lindenstraße ist fällig.',                 '/aufgaben',    false, NOW()),
  ('rechnung',  'Rechnung überfällig',           'RE-2026-002 ist seit 12 Tagen überfällig.',               '/rechnungen',  true,  NOW() - INTERVAL '2 days');

COMMIT;
