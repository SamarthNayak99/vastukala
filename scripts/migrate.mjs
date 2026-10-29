import { readdir,readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool,transaction } from '../server/db.mjs';
export async function migrate() {
 await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 for(const name of (await readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()) {
  if((await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name])).rowCount) continue;
  await transaction(async client=>{await client.query(await readFile(`database/migrations/${name}`,'utf8'));await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);});
  console.log(`Applied ${name}`);
 }
}
if(process.argv[1]===path.resolve('scripts/migrate.mjs')) {try{await migrate();}finally{await pool.end();}}
