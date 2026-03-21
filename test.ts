import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const id = '54607542-d3f3-4181-b80d-5f5bc8b0958d';
    const res = await db.execute(sql`select count(*)::int from "comments" where "comments"."content_id" = ${id}`);
    console.log('SUCCESS:', res);
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}
run();
