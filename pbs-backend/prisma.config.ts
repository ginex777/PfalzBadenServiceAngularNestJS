import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    // Use ?? '' so `prisma generate` (build time, no DB) doesn't throw
    url: process.env['DATABASE_URL'] ?? '',
  },
});
