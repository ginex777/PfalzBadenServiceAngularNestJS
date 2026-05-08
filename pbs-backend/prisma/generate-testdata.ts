/**
 * Test data generator for PBS.
 * Clears all tables and inserts realistic, volume-sufficient data.
 *
 * Run: npm run testdata --prefix pbs-backend
 *
 * Accounts created:
 *   admin@pbs-service.de          Test1234!   (admin)
 *   thomas.mueller@pbs-service.de Test1234!   (mitarbeiter)
 *   anna.schmidt@pbs-service.de   Mitarbeiter1! (mitarbeiter)
 *   max.weber@pbs-service.de      Mitarbeiter1! (mitarbeiter)
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log('Clearing tables…');

  await prisma.$executeRaw`
    TRUNCATE TABLE
      refresh_tokens, audit_log, benachrichtigungen, pdf_archive,
      mahnungen, belege, buchhaltung, checklisten_submissions,
      checklisten_template_objekte, checklisten_templates,
      nachweise, stempel, mitarbeiter_stunden, hausmeister_einsaetze,
      muellplan, muellplan_pdf, aufgaben, wiederkehrende_rechnungen,
      vertraege, angebote, rechnungen, objekte, mitarbeiter,
      users, kunden, muellplan_vorlagen, vst_paid,
      gesperrte_monate, settings, wiederkehrende_ausgaben
    RESTART IDENTITY CASCADE
  `;

  console.log('Hashing passwords…');
  const hashAdmin = await bcrypt.hash('Test1234!', 12);
  const hashMitarbeiter = await bcrypt.hash('Mitarbeiter1!', 12);

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('Creating users…');
  const [uAdmin, uThomas, uAnna, uMax] = await Promise.all([
    prisma.users.create({
      data: { email: 'admin@pbs-service.de', password_hash: hashAdmin, rolle: 'admin', vorname: 'Dennis', nachname: 'Admin', aktiv: true },
    }),
    prisma.users.create({
      data: { email: 'thomas.mueller@pbs-service.de', password_hash: hashAdmin, rolle: 'mitarbeiter', vorname: 'Thomas', nachname: 'Müller', aktiv: true },
    }),
    prisma.users.create({
      data: { email: 'anna.schmidt@pbs-service.de', password_hash: hashMitarbeiter, rolle: 'mitarbeiter', vorname: 'Anna', nachname: 'Schmidt', aktiv: true },
    }),
    prisma.users.create({
      data: { email: 'max.weber@pbs-service.de', password_hash: hashMitarbeiter, rolle: 'mitarbeiter', vorname: 'Max', nachname: 'Weber', aktiv: true },
    }),
  ]);

  // ── Kunden ────────────────────────────────────────────────────────────────
  console.log('Creating kunden…');
  const [k1, k2, k3, k4, k5] = await Promise.all([
    prisma.kunden.create({ data: { name: 'Muster Immobilien GmbH', strasse: 'Hauptstraße 42', ort: 'München', tel: '089-123456', email: 'kontakt@muster-immo.de', notiz: 'Großkunde – monatliche Abrechnung' } }),
    prisma.kunden.create({ data: { name: 'Familie Bergmann', strasse: 'Rosenweg 7', ort: 'Augsburg', tel: '0821-987654', email: 'h.bergmann@privatmail.de', notiz: 'Privatkunde – zahlt pünktlich' } }),
    prisma.kunden.create({ data: { name: 'Gewerbepark Süd GmbH & Co. KG', strasse: 'Industriestraße 120', ort: 'Ingolstadt', tel: '0841-556677', email: 'verwaltung@gewerbepark-sued.de', notiz: 'Rechnungsempfänger: Verwaltung' } }),
    prisma.kunden.create({ data: { name: 'Stadtwerke Nördlingen', strasse: 'Marktplatz 5', ort: 'Nördlingen', tel: '09081-77800', email: 'facility@stadtwerke-noe.de', notiz: 'Öffentlicher Auftraggeber' } }),
    prisma.kunden.create({ data: { name: 'Hotel Sonnenhof KG', strasse: 'Seestraße 18', ort: 'Starnberg', tel: '08151-6600', email: 'technik@sonnenhof.de', notiz: 'Reinigung + Hausmeister – hohe Serviceerwartung' } }),
  ]);

  // ── Mitarbeiter ───────────────────────────────────────────────────────────
  console.log('Creating mitarbeiter…');
  const [mThomas, mAnna, mMax] = await Promise.all([
    prisma.mitarbeiter.create({ data: { user_id: uThomas.id, name: 'Thomas Müller', rolle: 'Hausmeister', stundenlohn: 18.5, email: 'thomas.mueller@pbs-service.de', tel: '0170-1234567', aktiv: true } }),
    prisma.mitarbeiter.create({ data: { user_id: uAnna.id, name: 'Anna Schmidt', rolle: 'Reinigungskraft', stundenlohn: 15.0, email: 'anna.schmidt@pbs-service.de', tel: '0171-9876543', aktiv: true } }),
    prisma.mitarbeiter.create({ data: { user_id: uMax.id, name: 'Max Weber', rolle: 'Hausmeister', stundenlohn: 17.0, email: 'max.weber@pbs-service.de', tel: '0172-3344556', aktiv: true } }),
  ]);

  // ── Objekte ───────────────────────────────────────────────────────────────
  console.log('Creating objekte…');
  const [o1, o2, o3, o4, o5, o6, o7] = await Promise.all([
    prisma.objekte.create({ data: { name: 'Wohnanlage Rosenweg', strasse: 'Rosenweg', hausnummer: '12-18', plz: '80333', ort: 'München', notiz: '24 WE, Tiefgarage, Aufzug', status: 'AKTIV', kunden_id: k1.id } }),
    prisma.objekte.create({ data: { name: 'Mehrfamilienhaus Lindenstraße', strasse: 'Lindenstraße', hausnummer: '5', plz: '80469', ort: 'München', notiz: '8 WE, Baujahr 1985', status: 'AKTIV', kunden_id: k1.id } }),
    prisma.objekte.create({ data: { name: 'Einfamilienhaus Bergmann', strasse: 'Rosenweg', hausnummer: '7', plz: '86150', ort: 'Augsburg', notiz: 'EFH mit Garten', status: 'AKTIV', kunden_id: k2.id } }),
    prisma.objekte.create({ data: { name: 'Bürogebäude Block A', strasse: 'Industriestraße', hausnummer: '120a', plz: '85049', ort: 'Ingolstadt', notiz: '4 Etagen, 32 Büros', status: 'AKTIV', kunden_id: k3.id } }),
    prisma.objekte.create({ data: { name: 'Lager & Logistik Halle B', strasse: 'Industriestraße', hausnummer: '120b', plz: '85049', ort: 'Ingolstadt', notiz: 'Lagerhalle 1200m²', status: 'AKTIV', kunden_id: k3.id } }),
    prisma.objekte.create({ data: { name: 'Wasserwerk Gebäude 1', strasse: 'Marktplatz', hausnummer: '5', plz: '86720', ort: 'Nördlingen', notiz: 'Öffentliches Gebäude', status: 'AKTIV', kunden_id: k4.id } }),
    prisma.objekte.create({ data: { name: 'Hotel Sonnenhof – Hauptgebäude', strasse: 'Seestraße', hausnummer: '18', plz: '82319', ort: 'Starnberg', notiz: '80 Zimmer, 3 Restaurantbereiche', status: 'AKTIV', kunden_id: k5.id } }),
  ]);

  // ── MuellplanVorlagen ─────────────────────────────────────────────────────
  console.log('Creating muellplan vorlagen…');
  await prisma.muellplanVorlagen.create({
    data: {
      name: 'Standard Wohnanlage',
      termine: [
        { muellart: 'Restmüll', farbe: '#6b7280', wochentag: 2, intervall: 'zweiwöchentlich' },
        { muellart: 'Biomüll', farbe: '#16a34a', wochentag: 2, intervall: 'wöchentlich' },
        { muellart: 'Papiertonne', farbe: '#2563eb', wochentag: 4, intervall: 'vierwöchentlich' },
        { muellart: 'Gelbe Tonne', farbe: '#ca8a04', wochentag: 4, intervall: 'zweiwöchentlich' },
      ],
    },
  });

  // ── Muellplan ─────────────────────────────────────────────────────────────
  console.log('Creating muellplan…');
  await prisma.muellplan.createMany({
    data: [
      // Objekt 1
      { objekt_id: o1.id, muellart: 'Restmüll', farbe: '#6b7280', abholung: daysFromNow(3), erledigt: false, beschreibung: 'Tonnen 1-4 rausstellen', aktiv: true, user_id: uAdmin.id },
      { objekt_id: o1.id, muellart: 'Biomüll', farbe: '#16a34a', abholung: daysFromNow(4), erledigt: false, aktiv: true, user_id: uAdmin.id },
      { objekt_id: o1.id, muellart: 'Papiertonne', farbe: '#2563eb', abholung: daysFromNow(10), erledigt: false, aktiv: true, user_id: uAdmin.id },
      { objekt_id: o1.id, muellart: 'Gelbe Tonne', farbe: '#ca8a04', abholung: daysFromNow(11), erledigt: false, aktiv: true, user_id: uAdmin.id },
      { objekt_id: o1.id, muellart: 'Restmüll', farbe: '#6b7280', abholung: daysAgo(11), erledigt: true, beschreibung: 'Erledigt durch Müller', aktiv: true, user_id: uThomas.id },
      { objekt_id: o1.id, muellart: 'Sperrmüll', farbe: '#dc2626', abholung: daysFromNow(18), erledigt: false, beschreibung: 'Sperrmüll Keller', aktiv: true, user_id: uAdmin.id },
      // Objekt 2
      { objekt_id: o2.id, muellart: 'Restmüll', farbe: '#6b7280', abholung: daysFromNow(4), erledigt: false, aktiv: true, user_id: uAdmin.id },
      { objekt_id: o2.id, muellart: 'Biomüll', farbe: '#16a34a', abholung: daysFromNow(4), erledigt: false, aktiv: true, user_id: uAdmin.id },
      { objekt_id: o2.id, muellart: 'Papiertonne', farbe: '#2563eb', abholung: daysFromNow(12), erledigt: false, aktiv: true, user_id: uAdmin.id },
      // Objekt 4
      { objekt_id: o4.id, muellart: 'Restmüll', farbe: '#6b7280', abholung: daysFromNow(3), erledigt: false, beschreibung: '6 Tonnen gesamt', aktiv: true, user_id: uAdmin.id },
      { objekt_id: o4.id, muellart: 'Papiertonne', farbe: '#2563eb', abholung: daysFromNow(10), erledigt: false, beschreibung: '4 Papiertonnen', aktiv: true, user_id: uAdmin.id },
      { objekt_id: o4.id, muellart: 'Gelbe Tonne', farbe: '#ca8a04', abholung: daysAgo(14), erledigt: true, aktiv: true, user_id: uAnna.id },
    ],
  });

  // ── Rechnungen ────────────────────────────────────────────────────────────
  console.log('Creating rechnungen…');
  const pos = (items: Array<{ bez: string; stunden?: number; einzelpreis?: number; gesamtpreis: number }>) => JSON.stringify(items);

  const [re1, re2, re3, re4, re5, re6, re7] = await Promise.all([
    prisma.rechnungen.create({ data: { nr: 'RE-2026-001', empf: k1.name, str: 'Hauptstraße 42', ort: '80333 München', titel: 'Hausmeisterservice März 2026', datum: daysAgo(38), leistungsdatum: 'März 2026', email: k1.email!, zahlungsziel: 14, kunden_id: k1.id, brutto: 1547.30, frist: daysAgo(24), bezahlt: true, bezahlt_am: daysAgo(28), positionen: pos([{ bez: 'Hausmeisterdienste 80 Std.', stunden: 80, einzelpreis: 15.5, gesamtpreis: 1240 }, { bez: 'Materialkosten pauschal', gesamtpreis: 60.75 }, { bez: 'Winterdienst Notfall', stunden: 8, einzelpreis: 22, gesamtpreis: 176 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-002', empf: k3.name, str: 'Industriestraße 120', ort: '85049 Ingolstadt', titel: 'Gebäudereinigung April 2026', datum: daysAgo(37), leistungsdatum: 'April 2026', email: k3.email!, zahlungsziel: 14, kunden_id: k3.id, brutto: 2380.00, frist: daysAgo(23), bezahlt: false, positionen: pos([{ bez: 'Unterhaltsreinigung Block A – 40h', stunden: 40, einzelpreis: 18, gesamtpreis: 720 }, { bez: 'Glasreinigung Fassade', gesamtpreis: 560 }, { bez: 'Verbrauchsmaterial', gesamtpreis: 420 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-003', empf: k2.name, str: 'Rosenweg 7', ort: '86150 Augsburg', titel: 'Gartenservice Februar 2026', datum: daysAgo(69), leistungsdatum: 'Februar 2026', email: k2.email!, zahlungsziel: 14, kunden_id: k2.id, brutto: 297.50, frist: daysAgo(55), bezahlt: false, positionen: pos([{ bez: 'Gartenpflege 10 Std.', stunden: 10, einzelpreis: 22, gesamtpreis: 220 }, { bez: 'Heckenschnitt', gesamtpreis: 60 }, { bez: 'Entsorgung Grünschnitt', gesamtpreis: 17.5 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-004', empf: k1.name, str: 'Hauptstraße 42', ort: '80333 München', titel: 'Hausmeisterservice April 2026', datum: daysAgo(7), leistungsdatum: 'April 2026', email: k1.email!, zahlungsziel: 14, kunden_id: k1.id, brutto: 1620.00, frist: daysFromNow(7), bezahlt: false, positionen: pos([{ bez: 'Hausmeisterpauschale monatlich', gesamtpreis: 1200 }, { bez: 'Sonderreinigung Tiefgarage', gesamtpreis: 420 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-005', empf: k5.name, str: 'Seestraße 18', ort: '82319 Starnberg', titel: 'Reinigungsservice Mai 2026 – Hotel', datum: daysAgo(2), leistungsdatum: 'Mai 2026', email: k5.email!, zahlungsziel: 30, kunden_id: k5.id, brutto: 4850.00, frist: daysFromNow(28), bezahlt: false, positionen: pos([{ bez: 'Tägliche Zimmerreinigung 80h', stunden: 80, einzelpreis: 18, gesamtpreis: 1440 }, { bez: 'Küchen & Restaurantreinigung 60h', stunden: 60, einzelpreis: 16, gesamtpreis: 960 }, { bez: 'Glasreinigung Lobby', gesamtpreis: 850 }, { bez: 'Verbrauchsmaterial', gesamtpreis: 600 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-006', empf: k4.name, str: 'Marktplatz 5', ort: '86720 Nördlingen', titel: 'Gebäudepflege Q1 2026', datum: daysAgo(62), leistungsdatum: 'Q1 2026', email: k4.email!, zahlungsziel: 30, kunden_id: k4.id, brutto: 3200.00, frist: daysAgo(32), bezahlt: true, bezahlt_am: daysAgo(40), positionen: pos([{ bez: 'Unterhaltsreinigung 3 Monate', gesamtpreis: 2400 }, { bez: 'Außenreinigung pauschal', gesamtpreis: 800 }]), mwst_satz: 19 } }),
    prisma.rechnungen.create({ data: { nr: 'RE-2026-007', empf: k3.name, str: 'Industriestraße 120', ort: '85049 Ingolstadt', titel: 'Hausmeisterservice Halle B März 2026', datum: daysAgo(38), leistungsdatum: 'März 2026', email: k3.email!, zahlungsziel: 14, kunden_id: k3.id, brutto: 890.00, frist: daysAgo(24), bezahlt: true, bezahlt_am: daysAgo(20), positionen: pos([{ bez: 'Hausmeisterdienste 40 Std.', stunden: 40, einzelpreis: 18, gesamtpreis: 720 }, { bez: 'Materialkosten', gesamtpreis: 170 }]), mwst_satz: 19 } }),
  ]);

  // ── Mahnungen ─────────────────────────────────────────────────────────────
  console.log('Creating mahnungen…');
  await prisma.mahnungen.createMany({
    data: [
      { rechnung_id: re3.id, stufe: 1, datum: daysAgo(41), betrag_gebuehr: 5.00, notiz: '1. Mahnung – Zahlungserinnerung' },
      { rechnung_id: re3.id, stufe: 2, datum: daysAgo(21), betrag_gebuehr: 15.00, notiz: '2. Mahnung – mit Gebühr' },
      { rechnung_id: re2.id, stufe: 1, datum: daysAgo(9), betrag_gebuehr: 5.00, notiz: '1. Mahnung' },
    ],
  });

  // ── Angebote ──────────────────────────────────────────────────────────────
  console.log('Creating angebote…');
  await prisma.angebote.createMany({
    data: [
      { nr: 'AN-2026-001', empf: k1.name, str: 'Hauptstraße 42', ort: '80333 München', titel: 'Jahresvertrag Hausmeisterservice 2026/2027', datum: daysAgo(37), brutto: 18564.00, gueltig_bis: daysFromNow(24), angenommen: true, abgelehnt: false, gesendet: true, positionen: pos([{ bez: 'Monatliche Hausmeisterpauschale', gesamtpreis: 1200 }, { bez: 'Winterdienst pauschal', gesamtpreis: 1800 }, { bez: 'Notfalldienst 10×', gesamtpreis: 564 }]), kunden_id: k1.id },
      { nr: 'AN-2026-002', empf: k3.name, str: 'Industriestraße 120', ort: '85049 Ingolstadt', titel: 'Erweiterung Reinigungsvertrag Halle C', datum: daysAgo(23), brutto: 3570.00, gueltig_bis: daysFromNow(7), angenommen: false, abgelehnt: false, gesendet: true, positionen: pos([{ bez: 'Unterhaltsreinigung Halle C monatlich', gesamtpreis: 2800 }, { bez: 'Grundreinigung einmalig', gesamtpreis: 770 }]), kunden_id: k3.id },
      { nr: 'AN-2026-003', empf: k5.name, str: 'Seestraße 18', ort: '82319 Starnberg', titel: 'Jahresvertrag Hotelreinigung 2026', datum: daysAgo(14), brutto: 58200.00, gueltig_bis: daysFromNow(16), angenommen: false, abgelehnt: false, gesendet: true, positionen: pos([{ bez: 'Tägliche Zimmerreinigung monatlich', gesamtpreis: 4200 }, { bez: 'Glasreinigung quartalsweise', gesamtpreis: 850 }]), kunden_id: k5.id },
      { nr: 'AN-2026-004', empf: k4.name, str: 'Marktplatz 5', ort: '86720 Nördlingen', titel: 'Wartungsvertrag Gebäudetechnik', datum: daysAgo(5), brutto: 2400.00, gueltig_bis: daysFromNow(25), angenommen: false, abgelehnt: false, gesendet: false, positionen: pos([{ bez: 'Monatliche Inspektion pauschal', gesamtpreis: 200 }]), kunden_id: k4.id },
      { nr: 'AN-2025-015', empf: k2.name, str: 'Rosenweg 7', ort: '86150 Augsburg', titel: 'Gartenpflegevertrag 2025 – abgelehnt', datum: daysAgo(200), brutto: 1800.00, gueltig_bis: daysAgo(170), angenommen: false, abgelehnt: true, gesendet: true, positionen: pos([{ bez: 'Gartenpflege monatlich', gesamtpreis: 150 }]), kunden_id: k2.id },
    ],
  });

  // ── Buchhaltung ───────────────────────────────────────────────────────────
  console.log('Creating buchhaltung…');
  const curYear = new Date().getFullYear();
  await prisma.buchhaltung.createMany({
    data: [
      { jahr: curYear, monat: 1, typ: 'EIN', name: `${k1.name} – RE-${curYear}-006`, datum: daysAgo(100), brutto: 3200.00, mwst: 19, abzug: 100, kategorie: 'Reinigung', renr: 'RE-2026-006' },
      { jahr: curYear, monat: 2, typ: 'AUS', name: 'Reinigungsmittel Nachschub', datum: daysAgo(90), brutto: 128.50, mwst: 19, abzug: 100, kategorie: 'Betriebsmaterial' },
      { jahr: curYear, monat: 2, typ: 'AUS', name: 'Kraftstoff Dienstfahrzeug', datum: daysAgo(88), brutto: 87.20, mwst: 19, abzug: 100, kategorie: 'Fahrzeugkosten' },
      { jahr: curYear, monat: 3, typ: 'EIN', name: `${k1.name} – RE-${curYear}-001`, datum: daysAgo(28), brutto: 1547.30, mwst: 19, abzug: 100, kategorie: 'Hausmeisterservice', renr: 'RE-2026-001' },
      { jahr: curYear, monat: 3, typ: 'EIN', name: `${k3.name} – RE-${curYear}-007`, datum: daysAgo(20), brutto: 890.00, mwst: 19, abzug: 100, kategorie: 'Hausmeisterservice', renr: 'RE-2026-007' },
      { jahr: curYear, monat: 3, typ: 'AUS', name: 'Arbeitsschutzkleidung', datum: daysAgo(82), brutto: 214.80, mwst: 19, abzug: 100, kategorie: 'Betriebsausgabe' },
      { jahr: curYear, monat: 4, typ: 'AUS', name: 'Werkzeug Staubsauger Industrie', datum: daysAgo(22), brutto: 349.00, mwst: 19, abzug: 100, kategorie: 'Betriebsmaterial' },
      { jahr: curYear, monat: 4, typ: 'AUS', name: 'Kraftstoff April', datum: daysAgo(15), brutto: 104.30, mwst: 19, abzug: 100, kategorie: 'Fahrzeugkosten' },
    ],
  });

  // ── MitarbeiterStunden ────────────────────────────────────────────────────
  console.log('Creating mitarbeiter stunden…');
  await prisma.mitarbeiterStunden.createMany({
    data: [
      { mitarbeiter_id: mThomas.id, datum: daysAgo(14), stunden: 8.00, beschreibung: 'Hausmeisterdienst Rosenweg', ort: 'München', lohn: 148.00, zuschlag: 0, zuschlag_typ: '', bezahlt: true },
      { mitarbeiter_id: mThomas.id, datum: daysAgo(13), stunden: 6.50, beschreibung: 'Reparatur Aufzug Lindenstraße', ort: 'München', lohn: 120.25, zuschlag: 22.00, zuschlag_typ: 'Notfall', bezahlt: true },
      { mitarbeiter_id: mAnna.id, datum: daysAgo(14), stunden: 7.00, beschreibung: 'Unterhaltsreinigung Bürogebäude', ort: 'Ingolstadt', lohn: 105.00, zuschlag: 0, zuschlag_typ: '', bezahlt: true },
      { mitarbeiter_id: mThomas.id, datum: daysAgo(12), stunden: 8.00, beschreibung: 'Gartenpflege Rosenweg', ort: 'München', lohn: 148.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mAnna.id, datum: daysAgo(12), stunden: 5.00, beschreibung: 'Glasreinigung Fassade Block A', ort: 'Ingolstadt', lohn: 75.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mMax.id, datum: daysAgo(11), stunden: 8.00, beschreibung: 'Hausmeisterdienst Hotel Sonnenhof', ort: 'Starnberg', lohn: 136.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mMax.id, datum: daysAgo(10), stunden: 4.00, beschreibung: 'Kleinreparaturen Hotel', ort: 'Starnberg', lohn: 68.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mAnna.id, datum: daysAgo(7), stunden: 8.00, beschreibung: 'Hotelzimmer Reinigung', ort: 'Starnberg', lohn: 120.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mThomas.id, datum: daysAgo(7), stunden: 8.00, beschreibung: 'Hausbegehung Wohnanlage Rosenweg', ort: 'München', lohn: 148.00, zuschlag: 0, zuschlag_typ: '', bezahlt: false },
      { mitarbeiter_id: mThomas.id, datum: daysAgo(5), stunden: 3.00, beschreibung: 'Notdienst Wasserrohr', ort: 'München', lohn: 55.50, zuschlag: 55.50, zuschlag_typ: 'Notfall', bezahlt: false },
    ],
  });

  // ── Stempel ───────────────────────────────────────────────────────────────
  console.log('Creating stempel…');
  const makeStempel = (mId: bigint, oId: bigint, daysBack: number, startH: number, endH: number, notiz?: string) => {
    const start = new Date(); start.setDate(start.getDate() - daysBack); start.setHours(startH, 30, 0, 0);
    const stop = new Date(); stop.setDate(stop.getDate() - daysBack); stop.setHours(endH, 0, 0, 0);
    return { mitarbeiter_id: mId, objekt_id: oId, start, stop, dauer_minuten: (endH - startH) * 60 - 30, notiz: notiz ?? null };
  };
  await prisma.stempel.createMany({
    data: [
      makeStempel(mThomas.id, o1.id, 14, 7, 16, 'Regulärer Hausmeistertag'),
      makeStempel(mAnna.id, o4.id, 14, 8, 13, 'Büroreinigung Block A'),
      makeStempel(mThomas.id, o2.id, 11, 8, 12, 'Inspektion Lindenstraße'),
      makeStempel(mMax.id, o7.id, 10, 7, 15, 'Hoteldienst Sonnenhof'),
      makeStempel(mAnna.id, o7.id, 7, 8, 16, 'Zimmerreinigung Hotel'),
      makeStempel(mThomas.id, o1.id, 7, 7, 15, 'Hausmeistertag Rosenweg'),
    ],
  });

  // ── HausmeisterEinsaetze ──────────────────────────────────────────────────
  console.log('Creating hausmeister einsaetze…');
  await prisma.hausmeisterEinsaetze.createMany({
    data: [
      { mitarbeiter_id: mThomas.id, mitarbeiter_name: 'Thomas Müller', kunden_id: k1.id, kunden_name: k1.name, datum: daysAgo(14), taetigkeiten: [{ beschreibung: 'Treppenhausreinigung', dauer: 2 }, { beschreibung: 'Mülltonnen bereitstellen', dauer: 0.5 }, { beschreibung: 'Glühbirne Keller', dauer: 0.25 }], stunden_gesamt: 2.75, abgeschlossen: true },
      { mitarbeiter_id: mThomas.id, mitarbeiter_name: 'Thomas Müller', kunden_id: k1.id, kunden_name: k1.name, datum: daysAgo(13), taetigkeiten: [{ beschreibung: 'Aufzugstechniker begleiten', dauer: 1.5 }, { beschreibung: 'Protokoll', dauer: 0.5 }, { beschreibung: 'Außenanlage kontrollieren', dauer: 1 }], stunden_gesamt: 3.00, notiz: 'Aufzug wieder in Betrieb', abgeschlossen: true },
      { mitarbeiter_id: mMax.id, mitarbeiter_name: 'Max Weber', kunden_id: k5.id, kunden_name: k5.name, datum: daysAgo(10), taetigkeiten: [{ beschreibung: 'Lobby Bodenreinigung', dauer: 2 }, { beschreibung: 'Technikraum Inspektion', dauer: 1 }, { beschreibung: 'Außenbeleuchtung prüfen', dauer: 0.5 }], stunden_gesamt: 3.50, abgeschlossen: true },
      { mitarbeiter_id: mThomas.id, mitarbeiter_name: 'Thomas Müller', kunden_id: k1.id, kunden_name: k1.name, datum: daysAgo(7), taetigkeiten: [{ beschreibung: 'Wöchentliche Hausbegehung', dauer: 1.5 }, { beschreibung: 'Kleinreparaturen', dauer: 2 }], stunden_gesamt: 3.50, abgeschlossen: false },
    ],
  });

  // ── Checklisten Templates ─────────────────────────────────────────────────
  console.log('Creating checklisten templates…');
  const [ct1, ct2] = await Promise.all([
    prisma.checklistenTemplates.create({
      data: {
        name: 'Wöchentliche Hausbegehung',
        description: 'Standardcheckliste für wöchentliche Inspektion',
        kategorie: 'Inspektion',
        version: 1,
        fields: [
          { id: 'f1', label: 'Treppenhaus sauber', type: 'checkbox', required: true },
          { id: 'f2', label: 'Briefkastenanlage in Ordnung', type: 'checkbox', required: true },
          { id: 'f3', label: 'Außenbeleuchtung funktionsfähig', type: 'checkbox', required: true },
          { id: 'f4', label: 'Mülltonnenbereich aufgeräumt', type: 'checkbox', required: true },
          { id: 'f5', label: 'Keller zugänglich', type: 'checkbox', required: false },
          { id: 'f6', label: 'Schäden / Besonderheiten', type: 'text', required: false },
        ],
        is_active: true,
      },
    }),
    prisma.checklistenTemplates.create({
      data: {
        name: 'Monatliche Tiefgaragen-Kontrolle',
        description: 'Inspektion Tiefgarage auf Sicherheit und Sauberkeit',
        kategorie: 'Inspektion',
        version: 1,
        fields: [
          { id: 'f1', label: 'Beleuchtung vollständig funktionsfähig', type: 'checkbox', required: true },
          { id: 'f2', label: 'Fluchtwege frei', type: 'checkbox', required: true },
          { id: 'f3', label: 'Boden sauber (Öl, Laub)', type: 'checkbox', required: true },
          { id: 'f4', label: 'Tor-Mechanik einwandfrei', type: 'checkbox', required: true },
          { id: 'f5', label: 'Anmerkungen', type: 'text', required: false },
        ],
        is_active: true,
      },
    }),
  ]);

  // ── Checklisten Template Objekte ──────────────────────────────────────────
  await prisma.checklistenTemplateObjekte.createMany({
    data: [
      { template_id: ct1.id, objekt_id: o1.id },
      { template_id: ct1.id, objekt_id: o2.id },
      { template_id: ct2.id, objekt_id: o1.id },
    ],
  });

  // ── Checklisten Submissions ───────────────────────────────────────────────
  console.log('Creating checklisten submissions…');
  await prisma.checklistenSubmissions.createMany({
    data: [
      { template_id: ct1.id, objekt_id: o1.id, mitarbeiter_id: mThomas.id, created_by_email: mThomas.email!, created_by_name: mThomas.name, submitted_at: daysAgo(14), template_snapshot: { id: Number(ct1.id), name: ct1.name, version: 1 }, answers: { f1: true, f2: true, f3: true, f4: true, f5: true, f6: 'Kellertür Schloss klemmt leicht' }, note: 'Alles in Ordnung bis auf Kellertür' },
      { template_id: ct1.id, objekt_id: o1.id, mitarbeiter_id: mThomas.id, created_by_email: mThomas.email!, created_by_name: mThomas.name, submitted_at: daysAgo(7), template_snapshot: { id: Number(ct1.id), name: ct1.name, version: 1 }, answers: { f1: true, f2: true, f3: false, f4: true, f5: true, f6: 'Außenlampe Eingang defekt – Meldung aufgegeben' }, note: null },
      { template_id: ct1.id, objekt_id: o2.id, mitarbeiter_id: mThomas.id, created_by_email: mThomas.email!, created_by_name: mThomas.name, submitted_at: daysAgo(11), template_snapshot: { id: Number(ct1.id), name: ct1.name, version: 1 }, answers: { f1: true, f2: true, f3: true, f4: false, f5: false, f6: 'Mülltonne übergelaufen' }, note: 'Müllbereich war zugemüllt' },
    ],
  });

  // ── Tasks / Aufgaben ──────────────────────────────────────────────────────
  console.log('Creating aufgaben…');
  await prisma.tasks.createMany({
    data: [
      { title: 'Mülltonnen Rosenweg bereitstellen', type: 'MUELL', status: 'OFFEN', object_id: o1.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mThomas.id, due_at: daysFromNow(3) },
      { title: 'Wöchentliche Hausbegehung Rosenweg', type: 'KONTROLLE', status: 'OFFEN', object_id: o1.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mThomas.id, due_at: daysFromNow(4) },
      { title: 'Aufzugswartung Lindenstraße', type: 'REPARATUR', status: 'IN_BEARBEITUNG', object_id: o2.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mThomas.id, due_at: daysFromNow(7), comment: 'Techniker Termin kommende Woche' },
      { title: 'Glasreinigung Fassade Block A', type: 'REINIGUNG', status: 'ERLEDIGT', object_id: o4.id, customer_id: k3.id, user_id: uAdmin.id, employee_id: mAnna.id, due_at: daysAgo(12), comment: 'Abgeschlossen, Fotos gemacht', completed_at: daysAgo(12) },
      { title: 'Grundreinigung nach Mieterwechsel', type: 'REINIGUNG', status: 'OFFEN', object_id: o2.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mAnna.id, due_at: daysFromNow(12), comment: 'Wohnung 3. OG links' },
      { title: 'Außenbeleuchtung prüfen Rosenweg', type: 'KONTROLLE', status: 'UEBERFAELLIG', object_id: o1.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mThomas.id, due_at: daysAgo(3) },
      { title: 'Hotelzimmer Grundreinigung 2. Etage', type: 'REINIGUNG', status: 'OFFEN', object_id: o7.id, customer_id: k5.id, user_id: uAdmin.id, employee_id: mAnna.id, due_at: daysFromNow(2) },
      { title: 'Monatliche Tiefgaragen-Kontrolle', type: 'KONTROLLE', status: 'OFFEN', object_id: o1.id, customer_id: k1.id, user_id: uAdmin.id, employee_id: mThomas.id, due_at: daysFromNow(5) },
    ],
  });

  // ── Wiederkehrende Rechnungen ─────────────────────────────────────────────
  console.log('Creating wiederkehrende rechnungen…');
  await prisma.wiederkehrendeRechnungen.createMany({
    data: [
      { kunden_id: k1.id, kunden_name: k1.name, titel: 'Hausmeisterservice monatlich', positionen: [{ bez: 'Hausmeisterpauschale monatlich', gesamtpreis: 1200 }], intervall: 'monatlich', aktiv: true, letzte_erstellung: daysAgo(7) },
      { kunden_id: k5.id, kunden_name: k5.name, titel: 'Hotelreinigung monatlich', positionen: [{ bez: 'Reinigungspauschale Hotel', gesamtpreis: 4200 }], intervall: 'monatlich', aktiv: true, letzte_erstellung: daysAgo(2) },
    ],
  });

  // ── Vertraege ─────────────────────────────────────────────────────────────
  console.log('Creating vertraege…');
  await prisma.vertraege.createMany({
    data: [
      { kunden_id: k1.id, kunden_name: k1.name, kunden_strasse: 'Hauptstraße 42', kunden_ort: '80333 München', vorlage: 'hausmeister', titel: 'Hausmeisterdienstleistungsvertrag 2026', vertragsbeginn: new Date('2026-01-01'), laufzeit_monate: 24, monatliche_rate: 1200, leistungsumfang: 'Monatliche Hausmeisterdienste für Rosenweg + Lindenstraße inkl. Winterdienst', kuendigungsfrist: 3, status: 'aktiv' },
      { kunden_id: k5.id, kunden_name: k5.name, kunden_strasse: 'Seestraße 18', kunden_ort: '82319 Starnberg', vorlage: 'reinigung', titel: 'Reinigungsvertrag Hotel Sonnenhof 2026', vertragsbeginn: new Date('2026-03-01'), laufzeit_monate: 12, monatliche_rate: 4200, leistungsumfang: 'Tägliche Zimmerreinigung, wöchentliche Tiefenreinigung, Glasreinigung quartalsweise', kuendigungsfrist: 2, status: 'aktiv' },
    ],
  });

  // ── Wiederkehrende Ausgaben ───────────────────────────────────────────────
  console.log('Creating wiederkehrende ausgaben…');
  await prisma.wiederkehrendeAusgaben.createMany({
    data: [
      { name: 'Fahrzeugversicherung Transporter', kategorie: 'Fahrzeugkosten', brutto: 89.50, mwst: 19, abzug: 100, aktiv: true },
      { name: 'Werkzeugversicherung', kategorie: 'Betriebsausgabe', brutto: 34.00, mwst: 19, abzug: 100, aktiv: true },
      { name: 'Buchhaltungssoftware Lizenz', kategorie: 'Bürokosten', brutto: 49.00, mwst: 19, abzug: 100, aktiv: true },
      { name: 'Berufsgenossenschaft Beitrag', kategorie: 'Versicherung', brutto: 215.00, mwst: 0, abzug: 100, aktiv: true },
      { name: 'Telefon + Internet Büro', kategorie: 'Bürokosten', brutto: 59.90, mwst: 19, abzug: 100, aktiv: true },
    ],
  });

  // ── VstPaid ───────────────────────────────────────────────────────────────
  await prisma.vstPaid.createMany({
    data: [
      { jahr: curYear - 1, quartal: 'Q3', paid: true, datum: new Date(`${curYear - 1}-10-10`) },
      { jahr: curYear - 1, quartal: 'Q4', paid: true, datum: new Date(`${curYear}-01-10`) },
      { jahr: curYear, quartal: 'Q1', paid: true, datum: daysAgo(28) },
    ],
  });

  // ── Settings ──────────────────────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { key: 'firma' },
    update: { value: JSON.stringify({ name: 'PBS Service GmbH', strasse: 'Musterstraße 1', ort: '80331 München', tel: '089-999999', email: 'info@pbs-service.de', ust_id: 'DE123456789', steuernummer: '123/456/78900', bank_name: 'Musterbank', iban: 'DE12345678901234567890', bic: 'MUSTBIC1' }) },
    create: { key: 'firma', value: JSON.stringify({ name: 'PBS Service GmbH', strasse: 'Musterstraße 1', ort: '80331 München', tel: '089-999999', email: 'info@pbs-service.de', ust_id: 'DE123456789', steuernummer: '123/456/78900', bank_name: 'Musterbank', iban: 'DE12345678901234567890', bic: 'MUSTBIC1' }) },
  });

  // ── Benachrichtigungen ────────────────────────────────────────────────────
  await prisma.benachrichtigungen.createMany({
    data: [
      { typ: 'mahnung', titel: 'Mahnung versendet', nachricht: `RE-2026-003 an ${k2.name} – 2. Mahnung.`, link: '/rechnungen', gelesen: false },
      { typ: 'aufgabe', titel: 'Aufgabe überfällig', nachricht: 'Außenbeleuchtung Rosenweg ist überfällig.', link: '/aufgaben', gelesen: false },
      { typ: 'rechnung', titel: 'Rechnung überfällig', nachricht: `RE-2026-002 (${k3.name}) ist seit >3 Wochen offen.`, link: '/rechnungen', gelesen: false },
      { typ: 'aufgabe', titel: 'Neue Aufgabe zugewiesen', nachricht: 'Hotelzimmer Grundreinigung – fällig in 2 Tagen.', link: '/aufgaben', gelesen: true },
    ],
  });

  console.log('\n✓ Test data generated successfully.\n');
  console.log('Login credentials:');
  console.log('  admin@pbs-service.de          → Test1234!   (admin)');
  console.log('  thomas.mueller@pbs-service.de → Test1234!   (mitarbeiter)');
  console.log('  anna.schmidt@pbs-service.de   → Mitarbeiter1! (mitarbeiter)');
  console.log('  max.weber@pbs-service.de      → Mitarbeiter1! (mitarbeiter)');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
