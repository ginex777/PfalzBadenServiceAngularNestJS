import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

export interface BillingPositionInput {
  bez: string;
  stunden?: number;
  einzelpreis?: number;
  gesamtpreis: number;
}

export interface BillingTotals {
  netto: number;
  mwstBetrag: number;
  brutto: number;
}

const CENTS = 100;

export function roundCurrency(value: number): number {
  return Math.round(value * CENTS) / CENTS;
}

export function calculateBillingTotals(
  positions: readonly BillingPositionInput[],
  vatRate: number,
): BillingTotals {
  const netto = roundCurrency(
    positions.reduce((sum, position) => sum + position.gesamtpreis, 0),
  );
  const mwstBetrag = roundCurrency(netto * (vatRate / 100));
  return {
    netto,
    mwstBetrag,
    brutto: roundCurrency(netto + mwstBetrag),
  };
}

export function calculateDueDate(
  invoiceDate: string | Date | null | undefined,
  paymentTermDays: number,
): Date | null {
  if (!invoiceDate) return null;
  const date =
    invoiceDate instanceof Date
      ? new Date(invoiceDate)
      : new Date(`${invoiceDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Ungueltiges Rechnungsdatum.');
  }
  date.setUTCDate(date.getUTCDate() + paymentTermDays);
  return date;
}

export function positionsToJson(
  positions: readonly BillingPositionInput[],
): Prisma.InputJsonValue {
  return positions.map((position) => ({
    bez: position.bez,
    stunden: position.stunden ?? null,
    einzelpreis: position.einzelpreis ?? null,
    gesamtpreis: position.gesamtpreis,
  }));
}

export function positionsFromJson(value: unknown): BillingPositionInput[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isBillingPositionRecord).map((position) => ({
    bez: position.bez,
    stunden:
      typeof position.stunden === 'number' ? position.stunden : undefined,
    einzelpreis:
      typeof position.einzelpreis === 'number'
        ? position.einzelpreis
        : undefined,
    gesamtpreis: position.gesamtpreis,
  }));
}

function isBillingPositionRecord(
  value: unknown,
): value is Prisma.JsonObject & BillingPositionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!('bez' in value) || !('gesamtpreis' in value)) return false;
  return typeof value.bez === 'string' && typeof value.gesamtpreis === 'number';
}
