import path from 'path';
import { config } from 'dotenv';

// Загружаем .env из каталога с конфигом (на сервере — /opt/sfera)
const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
config({ path: path.resolve(rootDir, '.env') });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon',
  },
});
