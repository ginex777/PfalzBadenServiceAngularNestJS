import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingCustomer = await prisma.kunden.findFirst({
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  const customerId =
    existingCustomer?.id ??
    (
      await prisma.kunden.create({
        data: {
          name: 'Demo Kunde',
          strasse: 'Musterstrasse 1',
          ort: 'Musterstadt',
          email: 'demo@example.com',
          tel: '0000-000000',
        },
        select: { id: true },
      })
    ).id;

  const existingObject = await prisma.objekte.findFirst({
    where: { kunden_id: customerId },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  const objectId =
    existingObject?.id ??
    (
      await prisma.objekte.create({
        data: {
          name: 'Demo Objekt',
          strasse: 'Musterstrasse',
          hausnummer: '1',
          plz: '12345',
          ort: 'Musterstadt',
          status: 'AKTIV',
          kunden: { connect: { id: customerId } },
        },
        select: { id: true },
      })
    ).id;

  const existingTask = await prisma.tasks.findFirst({
    where: { object_id: objectId },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  if (!existingTask) {
    const dueAt = new Date();
    dueAt.setHours(0, 0, 0, 0);

    await prisma.tasks.create({
      data: {
        title: 'Demo Aufgabe',
        type: 'SONSTIGES',
        status: 'OFFEN',
        object: { connect: { id: objectId } },
        customer: { connect: { id: customerId } },
        due_at: dueAt,
        comment: 'Seeded demo task',
      },
      select: { id: true },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

