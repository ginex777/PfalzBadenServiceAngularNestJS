import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';
import { PuppeteerService } from '../src/modules/pdf/puppeteer.service';

describe('AppModule (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;

  const adminEmail = 'e2e.admin@example.test';
  const adminPassword = 'StrongerPass123!';

  beforeAll(async () => {
    process.env['DATABASE_URL'] ??=
      'postgresql://pbs:pbs_secret@localhost:5433/pbs';
    process.env['JWT_SECRET'] ??= 'test-secret';
    process.env['JWT_EXPIRES_IN'] = '15m';
    process.env['JWT_REFRESH_EXPIRES_IN'] = '60';
    process.env['PDF_TOKEN_TTL_MS'] = '250';

    const moduleFixtureBuilder = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PuppeteerService)
      .useValue({
        htmlZuPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4\n%%EOF')),
      });

    const moduleFixture: TestingModule = await moduleFixtureBuilder.compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          ok: true,
          timestamp: expect.any(String),
        });
      });
  });

  it('covers auth setup, login, refresh, access-token expiry, and relogin', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ message: 'Admin-Account erstellt' });
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const accessToken = String(loginResponse.body.accessToken);
    const refreshToken = String(loginResponse.body.refreshToken);
    expect(accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(refreshToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(String(refreshResponse.body.accessToken)).toMatch(
      /^[\w-]+\.[\w-]+\.[\w-]+$/,
    );
    expect(String(refreshResponse.body.refreshToken)).toMatch(
      /^[\w-]+\.[\w-]+\.[\w-]+$/,
    );

    const user = await prisma.users.findUniqueOrThrow({
      where: { email: adminEmail },
      select: { id: true, email: true, rolle: true },
    });
    const expiredAccessToken = jwt.sign(
      {
        sub: user.id.toString(),
        userId: user.id.toString(),
        mitarbeiterId: null,
        email: user.email,
        rolle: user.rolle,
      },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/api/rechnungen')
      .set('Authorization', `Bearer ${expiredAccessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
  });

  it('covers invoice create, PDF send artifact, mark paid, and audit/archive records', async () => {
    const accessToken = await createAdminAndLogin();
    const invoiceNumber = `E2E-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/rechnungen')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-nutzer', adminEmail)
      .send({
        nr: invoiceNumber,
        empf: 'E2E Customer GmbH',
        str: 'Teststrasse 1',
        ort: '76131 Karlsruhe',
        titel: 'E2E Lifecycle Invoice',
        datum: '2026-05-07',
        leistungsdatum: 'Mai 2026',
        email: 'customer@example.test',
        zahlungsziel: 14,
        positionen: [
          {
            bez: 'Hausmeisterservice',
            stunden: 2,
            einzelpreis: 50,
            gesamtpreis: 100,
          },
        ],
        mwst_satz: 19,
      })
      .expect(201);

    const invoiceId = Number(createResponse.body.id);
    expect(invoiceId).toBeGreaterThan(0);
    expect(createResponse.body).toMatchObject({
      nr: invoiceNumber,
      empf: 'E2E Customer GmbH',
      brutto: 119,
      bezahlt: false,
    });

    const pdfResponse = await request(app.getHttpServer())
      .post('/api/pdf/rechnung')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rechnung_id: invoiceId })
      .expect(201);

    expect(String(pdfResponse.body.token)).toMatch(/^[a-f0-9]{32}$/);
    expect(String(pdfResponse.body.url)).toContain('/api/pdf/view/');

    const viewResponse = await request(app.getHttpServer())
      .get(String(pdfResponse.body.url))
      .expect(200);

    expect(viewResponse.headers['content-type']).toContain('application/pdf');
    expect(Buffer.isBuffer(viewResponse.body)).toBe(true);

    await request(app.getHttpServer())
      .put(`/api/rechnungen/${invoiceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-nutzer', adminEmail)
      .send({ bezahlt: true, bezahlt_am: '2026-05-07' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: invoiceId, bezahlt: true });
      });

    const auditRows = await prisma.auditLog.findMany({
      where: { tabelle: 'rechnungen', datensatz_id: BigInt(invoiceId) },
      orderBy: { zeitstempel: 'asc' },
    });
    expect(auditRows.map((row) => row.aktion)).toEqual(['CREATE', 'UPDATE']);
    expect(auditRows.every((row) => row.nutzer === adminEmail)).toBe(true);

    const archive = await prisma.pdfArchive.findFirst({
      where: { typ: 'rechnung', referenz_id: BigInt(invoiceId) },
    });
    expect(archive).toMatchObject({
      typ: 'rechnung',
      referenz_nr: invoiceNumber,
      filename: `Rechnung_${invoiceNumber}.pdf`,
    });
  });

  it('rejects expired PDF tokens', async () => {
    const accessToken = await createAdminAndLogin();
    const invoiceNumber = `E2E-EXP-${Date.now()}`;

    const invoiceResponse = await request(app.getHttpServer())
      .post('/api/rechnungen')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-nutzer', adminEmail)
      .send({
        nr: invoiceNumber,
        empf: 'Expired Token Customer',
        datum: '2026-05-07',
        positionen: [{ bez: 'Service', gesamtpreis: 10 }],
      })
      .expect(201);

    const pdfResponse = await request(app.getHttpServer())
      .post('/api/pdf/rechnung')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rechnung_id: Number(invoiceResponse.body.id) })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 1_100));

    await request(app.getHttpServer())
      .get(String(pdfResponse.body.url))
      .expect(401)
      .expect(({ body }) => {
        expect(body).toEqual({
          error: 'PDF nicht gefunden oder abgelaufen (5 Min. Limit)',
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });

  async function createAdminAndLogin(): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/setup')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    return String(loginResponse.body.accessToken);
  }

  async function cleanDatabase(): Promise<void> {
    await prisma.refreshTokens.deleteMany();
    await prisma.pdfArchive.deleteMany();
    await prisma.mahnungen.deleteMany();
    await prisma.rechnungen.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.users.deleteMany();
    await prisma.settings.deleteMany();
  }
});
