import 'dotenv/config';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://horizon:horizon_dev@localhost:5432/horizon';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  try {
    await sql.unsafe(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attachment_url text`);
    await sql.unsafe(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS attachment_type text`);
    console.log('OK: attachment_url и attachment_type добавлены в direct_messages');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
