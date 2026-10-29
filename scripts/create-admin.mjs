import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { writeFile,mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../server/db.mjs';
export async function createAdmin() {
 if((await pool.query('SELECT 1 FROM admins LIMIT 1')).rowCount) return;
 const email=(process.env.ADMIN_EMAIL||'admin@vastukala.local').toLowerCase();
 const password=process.env.ADMIN_PASSWORD||randomBytes(15).toString('base64url');
 if(password.length<12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
 await mkdir('.local',{recursive:true});
 await pool.query('INSERT INTO admins(email,password_hash) VALUES($1,$2)',[email,await bcrypt.hash(password,12)]);
 await writeFile('.local/admin-credentials.txt',`Local administrator\nEmail: ${email}\nPassword: ${password}\n`);
 console.log('Administrator created. Credentials saved in .local/admin-credentials.txt (ignored by Git).');
}
if(process.argv[1]===path.resolve('scripts/create-admin.mjs')) {try{await createAdmin();}finally{await pool.end();}}
