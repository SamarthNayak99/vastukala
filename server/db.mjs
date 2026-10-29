import 'dotenv/config';
import pg from 'pg';
// SQL DATE is a calendar value, not an instant. Preserve it across JSON backups
// and timezone changes instead of parsing local midnight into a JavaScript Date.
pg.types.setTypeParser(1082,value=>value);
import { readFile } from 'node:fs/promises';
let local = {};
try { local = JSON.parse(await readFile(new URL('../.local/runtime.json',import.meta.url),'utf8')); } catch {}
export const databaseUrl = process.env.DATABASE_URL || local.databaseUrl;
if (!databaseUrl) throw new Error('No PostgreSQL connection. Run npm run dev, or configure DATABASE_URL in .env.');
export const pool = new pg.Pool({connectionString: databaseUrl});
export async function transaction(fn) {
 const client = await pool.connect();
 try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
 catch (error) { await client.query('ROLLBACK'); throw error; }
 finally { client.release(); }
}
