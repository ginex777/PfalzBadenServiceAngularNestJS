import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  // Increase body size limit for base64 PDF/image uploads
  app.use(require('express').json({ limit: '25mb' }));
  app.use(require('express').urlencoded({ limit: '25mb', extended: true }));
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`\n  PBS Backend läuft auf http://localhost:${port}\n`);
}
bootstrap();
