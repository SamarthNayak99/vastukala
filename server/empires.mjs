import {pool,transaction} from './db.mjs';
import {z} from 'zod';
const year=z.number().int().min(-4000).max(2100).refine(n=>n!==0).nullable();
const range=x=>x.year_from===null||x.year_to===null||x.year_from<=x.year_to;
const text=z.string().trim().min(1).max(10000);
export const empireSchema=z.object({slug:z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),name:text.max(200),kind:z.enum(['empire','dynasty','kingdom','sultanate','confederacy','colonial administration','civilisation','chiefdom','patron family']),region:text.max(300),year_from:year,year_to:year,date_label:text.max(300),summary:text,history:text,architectural_notes:text,sources:z.array(z.object({source_id:z.number().int().positive(),topic:text.max(500),locator:z.string().max(2000).default('')})).min(1).max(30)}).strict().refine(range,'Start year must precede end year');
export const associationSchema=z.object({building_id:z.number().int().positive(),empire_id:z.number().int().positive(),relationship:z.enum(['construction','patronage','addition','restoration','historical_context']),evidence:text,source_id:z.number().int().positive(),locator:z.string().max(2000).default(''),year_from:year,year_to:year}).strict().refine(range,'Start year must precede end year');
export async function listEmpires(){return(await pool.query(`SELECT e.*,v.monument_count,
 (SELECT i.storage_key FROM building_empires be JOIN buildings b ON b.id=be.building_id JOIN images i ON i.building_id=b.id AND i.is_cover AND i.approved WHERE be.empire_id=e.id AND b.status='published' ORDER BY b.name LIMIT 1) AS cover_key
 FROM empires e JOIN empire_monument_summary v ON v.id=e.id ORDER BY e.year_from NULLS LAST,e.name`)).rows;}
export async function buildingEmpires(buildingId){return(await pool.query(`SELECT be.*,e.name,e.slug,e.kind,e.date_label,s.title AS source_title,s.url FROM building_empires be JOIN empires e ON e.id=be.empire_id JOIN sources s ON s.id=be.source_id WHERE be.building_id=$1 ORDER BY be.year_from NULLS LAST,e.name,be.relationship`,[buildingId])).rows;}
export async function getEmpire(slug){
 const e=(await pool.query('SELECT * FROM empires WHERE slug=$1',[slug])).rows[0];if(!e)return null;
 const [sources,monuments]=await Promise.all([
 pool.query('SELECT es.*,s.title,s.url,s.author_or_publisher FROM empire_sources es JOIN sources s ON s.id=es.source_id WHERE empire_id=$1 ORDER BY s.title',[e.id]),
 pool.query(`SELECT be.*,b.name,b.slug,b.date_label,b.summary,s.state,s.name AS site,src.title AS source_title,src.url,
 (SELECT storage_key FROM images WHERE building_id=b.id AND approved AND is_cover LIMIT 1) AS cover_key
 FROM building_empires be JOIN buildings b ON b.id=be.building_id JOIN sites s ON s.id=b.site_id JOIN sources src ON src.id=be.source_id WHERE be.empire_id=$1 AND b.status='published' ORDER BY b.year_from NULLS LAST,b.name,be.relationship`,[e.id])]);
 return {...e,sources:sources.rows,monuments:monuments.rows};
}
export async function saveEmpire(input,empireId){const e=empireSchema.parse(input);return transaction(async c=>{
 const cols=['slug','name','kind','region','year_from','year_to','date_label','summary','history','architectural_notes'],values=cols.map(k=>e[k]);
 const r=empireId?await c.query(`UPDATE empires SET ${cols.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id=$11 RETURNING id`,[...values,empireId]):await c.query(`INSERT INTO empires(${cols}) VALUES(${cols.map((_,i)=>'$'+(i+1))}) RETURNING id`,values);
 if(!r.rowCount)throw Object.assign(Error('Empire profile not found'),{status:404});const id=r.rows[0].id;
 await c.query('DELETE FROM empire_sources WHERE empire_id=$1',[id]);for(const s of e.sources)await c.query('INSERT INTO empire_sources(empire_id,source_id,topic,locator) VALUES($1,$2,$3,$4)',[id,s.source_id,s.topic,s.locator]);return {id};
});}
export async function saveAssociation(input,associationId){const a=associationSchema.parse(input),cols=['building_id','empire_id','relationship','evidence','source_id','locator','year_from','year_to'],values=cols.map(k=>a[k]);const r=associationId?await pool.query(`UPDATE building_empires SET ${cols.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id=$9 RETURNING *`,[...values,associationId]):await pool.query(`INSERT INTO building_empires(${cols}) VALUES(${cols.map((_,i)=>'$'+(i+1))}) RETURNING *`,values);if(!r.rowCount)throw Object.assign(Error('Association not found'),{status:404});return r.rows[0];}
