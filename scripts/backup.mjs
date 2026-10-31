import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import pg from 'pg';
import assert from 'node:assert/strict';
import {pool,databaseUrl} from '../server/db.mjs';
const tables=['states','sites','building_types','buildings','building_aliases','styles','materials','elements','building_styles','building_materials','building_elements','sources','citations','images','admins','hotspots','seed_tasks','building_events'];
const order=table=>['states','seed_tasks'].includes(table)?'name':'id';
const client=await pool.connect();const snapshot={format:'vastukala-logical-v2',dateEncoding:'iso-calendar-date',created_at:new Date().toISOString(),tables:{}};
try{await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');for(const table of tables)snapshot.tables[table]=(await client.query(`SELECT * FROM ${table} ORDER BY ${order(table)}`)).rows;await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
await mkdir('.local/backups',{recursive:true});const file=`.local/backups/catalogue-${Date.now()}.json`;await writeFile(file,JSON.stringify(snapshot,null,2));
console.log(`Logical backup saved: ${file} (includes admin password hashes; excludes sessions and photograph files)`);
if(process.argv.includes('--verify')){
 const controlUrl=new URL(databaseUrl);controlUrl.pathname='/postgres';const control=new pg.Client({connectionString:controlUrl.toString()});await control.connect();const name=`vastukala_restore_${Date.now()}`;let restore;
 try{await control.query(`CREATE DATABASE ${name}`);controlUrl.pathname=`/${name}`;restore=new pg.Client({connectionString:controlUrl.toString()});await restore.connect();await restore.query('BEGIN');
 await restore.query('CREATE TABLE schema_migrations(name text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
 for(const migration of(await readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()){await restore.query(await readFile(`database/migrations/${migration}`,'utf8'));await restore.query('INSERT INTO schema_migrations(name) VALUES($1)',[migration]);}
 await restore.query('DELETE FROM states');
 for(const table of tables){for(const row of snapshot.tables[table]){const keys=Object.keys(row);await restore.query(`INSERT INTO ${table}(${keys.join(',')}) OVERRIDING SYSTEM VALUE VALUES(${keys.map((_,i)=>`$${i+1}`).join(',')})`,keys.map(x=>row[x]));}if(!['states','seed_tasks'].includes(table))await restore.query(`SELECT setval(pg_get_serial_sequence('${table}','id'),GREATEST(COALESCE((SELECT max(id) FROM ${table}),1),1),(SELECT count(*)>0 FROM ${table}))`);}
 await restore.query('COMMIT');
 for(const table of tables)assert.equal(JSON.stringify((await restore.query(`SELECT * FROM ${table} ORDER BY ${order(table)}`)).rows),JSON.stringify(snapshot.tables[table]),`Restore differs for ${table}`);
 console.log(`Restore verified: all rows in ${tables.length} tables match the original snapshot.`);
 }finally{if(restore)await restore.end();await control.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);await control.end();}
}
await pool.end();
