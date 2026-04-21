import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/http-exception.filter';
import { LoggingInterceptor } from './core/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  const frontendUrl = process.env['FRONTEND_URL'];
  if (!frontendUrl && process.env['NODE_ENV'] === 'production') {
    throw new Error(
      'FRONTEND_URL environment variable is not set in production',
    );
  }
  app.enableCors({ origin: frontendUrl ?? '*', credentials: true });

  // ── Body size (base64 PDF/image uploads) ────────────────────────────────────
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ limit: '25mb', extended: true }));

  // ── Global pipes ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false, // don't throw on unknown — services cast internally
      transform: true, // auto-transform primitives (string → number etc.)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters + interceptors ───────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // ── Swagger (dev + staging only) ────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PBS API')
      .setDescription('Pfalz-Baden Service — Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-nutzer' }, 'x-nutzer')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    logger.log('Swagger UI: http://localhost:3000/api-docs');
  }

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  logger.log(`PBS Backend läuft auf http://localhost:${port}`);
}
void bootstrap();
