import EmbeddedPostgres from 'embedded-postgres';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
export async function startLocalPostgres() {
 await mkdir('.local',{recursive:true});
 let config;
 try { config=JSON.parse(await readFile('.local/runtime.json','utf8')); }
 catch { const password=randomBytes(24).toString('hex'); config={password,sessionSecret:randomBytes(48).toString('hex'),databaseUrl:`postgresql://postgres:${password}@127.0.0.1:55432/vastukala`}; await writeFile('.local/runtime.json',JSON.stringify(config,null,2)); }
 const postgres=new EmbeddedPostgres({databaseDir:path.resolve('.local/postgres'),user:'postgres',password:config.password,port:55432,persistent:true,initdbFlags:['--encoding=UTF8'],onLog:()=>{},onError:message=>process.stderr.write(String(message)+'\n')});
 let initialized=false; try { await access('.local/postgres/PG_VERSION'); initialized=true; } catch {}
 if(!initialized) await postgres.initialise();
 await postgres.start();
 const client=postgres.getPgClient(); await client.connect();
 const existing=await client.query("SELECT 1 FROM pg_database WHERE datname='vastukala'");
 if(!existing.rowCount) await client.query("CREATE DATABASE vastukala ENCODING 'UTF8' TEMPLATE template0");
 await client.end();
 return postgres;
}
if(process.argv[1]===path.resolve('scripts/postgres.mjs')) {
 const db=await startLocalPostgres(); console.log('Project PostgreSQL ready on 127.0.0.1:55432');
 for(const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{await db.stop();process.exit(0);});
}
