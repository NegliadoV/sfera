import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and fill in your database URL.'
  );
}

const globalForDb = globalThis as unknown as {
  _dbClient: postgres.Sql | undefined;
};

const client = globalForDb._dbClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalForDb._dbClient = client;
}

export const db = drizzle(client, { schema });
export * from './schema';
