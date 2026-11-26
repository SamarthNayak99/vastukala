import EmbeddedPostgres from 'embedded-postgres';
import {mkdir,readdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const root=path.join(project,'.local','qa');
const directory=path.resolve(root,`test-${Date.now()}-${randomBytes(6).toString('hex')}`);
if(!directory.startsWith(root+path.sep))throw new Error('Test database must stay inside the project QA directory.');
await mkdir(directory,{recursive:true});
const probe=createServer();
await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(0,'127.0.0.1',resolve);});
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const password=randomBytes(24).toString('hex');
// The library removes only this checked, uniquely named test directory on stop.
const db=new EmbeddedPostgres({databaseDir:directory,user:'postgres',password,port,persistent:false,initdbFlags:['--encoding=UTF8','--locale=C'],onLog:()=>{},onError:()=>{}});
let started=false;
try{
 await db.initialise();await db.start();started=true;
 const url=`postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
 const files=(await readdir(path.join(project,'tests'))).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>'tests/'+name);
 console.log(`Running ${files.length} test files against isolated PostgreSQL.`);
 const code=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--test',...files],{cwd:project,stdio:'inherit',env:{...process.env,DATABASE_URL:url,TEST_DATABASE_BASE_URL:url,LAB_DATABASE_URL:'',GROQ_API_KEY:''}});
  child.once('error',reject);child.once('exit',code=>resolve(code??1));
 });
 process.exitCode=code;
}finally{
 if(started)await db.stop();
}
console.log('Isolated test database stopped and removed.');
// embedded-postgres installs lifecycle hooks intended for long-running apps.
// Finish this one-shot command after its child and database are both closed.
process.exit(process.exitCode||0);
