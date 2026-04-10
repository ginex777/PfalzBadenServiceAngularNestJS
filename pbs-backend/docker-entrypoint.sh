#!/bin/sh
set -e

echo "[PBS Backend] Starte..."
echo "[PBS Backend] DATABASE_URL: ${DATABASE_URL:0:40}..."

# Retry-Logik: PostgreSQL kann trotz healthcheck noch nicht bereit sein
MAX_RETRIES=10
RETRY=0
until npx prisma migrate deploy 2>&1; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[PBS Backend] FEHLER: prisma migrate deploy nach $MAX_RETRIES Versuchen fehlgeschlagen."
    exit 1
  fi
  echo "[PBS Backend] Datenbank noch nicht bereit - Versuch $RETRY/$MAX_RETRIES, warte 5s..."
  sleep 5
done

echo "[PBS Backend] Migrationen abgeschlossen. Starte NestJS..."
exec node dist/src/main
