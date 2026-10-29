import 'dotenv/config';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {startLocalPostgres} from './postgres.mjs';
let postgres,server,vite;
try {
 if(!process.env.DATABASE_URL){
  // Reuse the project's existing local instance if it is already running.
  try {const runtime=JSON.parse(await readFile('.local/runtime.json','utf8'));const probe=new pg.Client({connectionString:runtime.databaseUrl,connectionTimeoutMillis:1500});try{await probe.connect();await probe.query('SELECT 1');}finally{await probe.end();}}
  catch {postgres=await startLocalPostgres();}
 }
 const {migrate}=await import('./migrate.mjs');await migrate();
 const {seed}=await import('./seed.mjs');await seed();
 const {createAdmin}=await import('./create-admin.mjs');await createAdmin();
 server=spawn(process.execPath,['--watch','--env-file-if-exists=.env','server/index.mjs'],{stdio:'inherit'});
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','client/vite.config.js'],{stdio:'inherit'});
 console.log('\nLocal admin credentials: .local/admin-credentials.txt');
 let stopping=false;
 async function stop(code=0){if(stopping)return;stopping=true;server?.kill();vite?.kill();const{pool}=await import('../server/db.mjs');await pool.end();if(postgres)await postgres.stop();process.exit(code);}
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
 for(const child of [server,vite])child.on('exit',code=>{if(!stopping)stop(code||0);});
}catch(error){console.error(error);if(postgres)await postgres.stop();process.exit(1);}
