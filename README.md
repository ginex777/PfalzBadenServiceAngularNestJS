# PBS Angular Webapp

## Starten (Docker)

```bash
cp .env.example .env
docker compose up -d
```

- Frontend: http://localhost
- Backend API: http://localhost:3000/api/health

## Lokale Entwicklung

```bash
# Backend
cd pbs-backend
npm install
npm run start:dev

# Frontend (neues Terminal)
cd pbs-webapp
npm install
npx ng serve --proxy-config proxy.conf.json
```

## PostgreSQL

PostgreSQL ist die Quelle der Wahrheit. Lokal via `docker-compose.yml` (Service `postgres`).

Migrationen:
1. `.env` konfigurieren (`DATABASE_URL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, ...)
2. Prisma Migrations ausfuehren (z.B. `npx prisma migrate deploy` im `pbs-backend`)

## Backup

Backups liegen in `data/backups/`. Manuell via:
```bash
curl -X POST http://localhost:3000/api/backup
```

## Testdaten

Löscht alle Daten und lädt realistische Testdaten (Kunden, Objekte, Müllplan, Rechnungen, Mitarbeiter, usw.).

```bash
docker exec -i pbs-db psql -U pbs -d pbs < pbs-backend/prisma/testdata.sql
```

Zugangsdaten nach dem Import:

| E-Mail                            | Passwort       | Rolle       |
|-----------------------------------|----------------|-------------|
| admin@pbs-service.de              | Test1234!      | Admin       |
| thomas.mueller@pbs-service.de     | Test1234!      | Mitarbeiter |
| anna.schmidt@pbs-service.de       | Mitarbeiter1!  | Mitarbeiter |

