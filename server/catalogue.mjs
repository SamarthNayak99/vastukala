import {buildingEmpires} from './empires.mjs';
import { pool,transaction } from './db.mjs';
import { z } from 'zod';
import {access} from 'node:fs/promises';
import photoManifest from '../research/media-manifest.json' with {type:'json'};

// The Vercel build checks every approved photo before publishing its static assets.
const hostedPhotos=new Set(photoManifest.filter(photo=>photo.approved).map(photo=>photo.storage_key));

const id=z.number().int().positive();
const link=z.object({id,notes:z.string().max(3000).default('')});
const hotspot=z.object({element_id:id,label:z.string().trim().min(1).max(100),x:z.number().min(0).max(100),y:z.number().min(0).max(100),note:z.string().max(2000).default('')});
const httpUrl=z.url().refine(x=>['http:','https:'].includes(new URL(x).protocol),'Use an HTTP or HTTPS URL');
const citation=z.object({source_id:id,claim_topic:z.string().min(1).max(500),locator:z.string().max(2000).default(''),note:z.string().max(3000).default(''),target_kind:z.enum(['style','material','element']).nullable().optional(),taxonomy_id:id.nullable().optional()}).refine(x=>Boolean(x.target_kind)===Boolean(x.taxonomy_id),'Citation target requires both kind and taxonomy ID');
const image=z.object({storage_key:z.string().regex(/^[a-z0-9-]+$/),source_page_url:httpUrl,original_url:httpUrl,author:z.string().min(1).max(2000),licence_code:z.string().min(1).max(100),licence_url:httpUrl,caption:z.string().min(1).max(1000),alt_text:z.string().min(1).max(1000),width:id,height:id,byte_size:id,modification_note:z.string().max(1000).default(''),sort_order:z.number().int().min(0).default(0),is_cover:z.boolean(),approved:z.boolean(),element_id:id.nullable().optional(),hotspots:z.array(hotspot).max(30).optional()});
export const buildingSchema=z.object({name:z.string().trim().min(1).max(200),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),site_id:id,type_id:id,summary:z.string().max(3000),history:z.string().max(10000),layout_notes:z.string().max(10000),year_from:z.number().int().nullable(),year_to:z.number().int().nullable(),date_label:z.string().min(1).max(200),date_precision:z.enum(['year','approximate','range','unknown']),status:z.enum(['draft','published','archived']),aliases:z.array(z.string().trim().min(1).max(200)).max(30),styles:z.array(link).max(30),materials:z.array(link).max(30),elements:z.array(link).max(50),citations:z.array(citation).max(100),images:z.array(image).max(30)}).superRefine((b,ctx)=>{
 if(b.year_from===0||b.year_to===0)ctx.addIssue({code:'custom',message:'There is no year zero; use a negative BCE or positive CE year.'});
 if(b.year_from!==null&&b.year_to!==null&&b.year_from>b.year_to)ctx.addIssue({code:'custom',message:'Start year must not exceed end year.'});
 for(const kind of ['styles','materials','elements'])if(new Set(b[kind].map(x=>x.id)).size!==b[kind].length)ctx.addIssue({code:'custom',message:`Duplicate ${kind}.`});
 if(new Set(b.aliases).size!==b.aliases.length)ctx.addIssue({code:'custom',message:'Duplicate aliases.'});
 if(b.images.filter(x=>x.is_cover).length>1)ctx.addIssue({code:'custom',message:'Choose only one cover photograph.'});
 if(b.status==='published'&&(!b.citations.length||!b.images.some(x=>x.is_cover&&x.approved)))ctx.addIssue({code:'custom',message:'Publishing requires a citation and an approved cover photograph.'});
 for(const im of b.images)if(im.element_id&&!b.elements.some(x=>x.id===im.element_id))ctx.addIssue({code:'custom',message:'Photo element must belong to this building.'});
 for(const im of b.images){
  if(new Set((im.hotspots||[]).map(x=>x.element_id)).size!==(im.hotspots||[]).length)ctx.addIssue({code:'custom',message:'Use one hotspot per element in a photograph.'});
  for(const h of im.hotspots||[]){
   if(!b.elements.some(x=>x.id===h.element_id))ctx.addIssue({code:'custom',message:'Hotspot element must belong to this building.'});
   if(!b.citations.some(c=>c.target_kind==='element'&&c.taxonomy_id===h.element_id))ctx.addIssue({code:'custom',message:'Each hotspot needs a citation for its architectural element.'});
  }
 }
});
export async function taxonomy() {
 const names=['sites','building_types','styles','materials','elements','sources','empires'];
 const results=await Promise.all(names.map(name=>pool.query(`SELECT * FROM ${name} ORDER BY ${name==='sources'?'title':'name'}`)));
 const states=(await pool.query(`SELECT s.name AS id,s.name,s.kind,count(b.id)::int AS count FROM states s LEFT JOIN sites l ON l.state=s.name LEFT JOIN buildings b ON b.site_id=l.id AND b.status='published' GROUP BY s.name ORDER BY s.name`)).rows;return {...Object.fromEntries(names.map((name,index)=>[name,results[index].rows])),states};
}
export async function getBuilding(value,{admin=false,byId=false}={}) {
 const result=await pool.query(`SELECT b.*,s.name AS site,s.slug AS site_slug,s.district,s.state,s.map_latitude,s.map_longitude,s.map_source_url,t.name AS type FROM buildings b JOIN sites s ON s.id=b.site_id JOIN building_types t ON t.id=b.type_id WHERE b.${byId?'id':'slug'}=$1 ${admin?'':"AND b.status='published'"}`,[value]);
 if(!result.rowCount)return null;
 const b=result.rows[0];
 const results=await Promise.all([
 pool.query('SELECT alias FROM building_aliases WHERE building_id=$1 ORDER BY alias',[b.id]),
 pool.query('SELECT s.id,s.name,bs.notes FROM building_styles bs JOIN styles s ON s.id=bs.style_id WHERE bs.building_id=$1 ORDER BY s.name',[b.id]),
 pool.query('SELECT m.id,m.name,bm.usage_notes AS notes FROM building_materials bm JOIN materials m ON m.id=bm.material_id WHERE bm.building_id=$1 ORDER BY m.name',[b.id]),
 pool.query('SELECT e.id,e.name,e.description,be.description AS notes FROM building_elements be JOIN elements e ON e.id=be.element_id WHERE be.building_id=$1 ORDER BY e.name',[b.id]),
 pool.query(`SELECT c.*,s.title,s.url,s.author_or_publisher, CASE WHEN c.building_style_id IS NOT NULL THEN 'style' WHEN c.building_material_id IS NOT NULL THEN 'material' WHEN c.building_element_id IS NOT NULL THEN 'element' END AS target_kind, COALESCE(bs.style_id,bm.material_id,be.element_id) AS taxonomy_id FROM citations c JOIN sources s ON s.id=c.source_id LEFT JOIN building_styles bs ON bs.id=c.building_style_id LEFT JOIN building_materials bm ON bm.id=c.building_material_id LEFT JOIN building_elements be ON be.id=c.building_element_id WHERE c.building_id=$1 ORDER BY c.id`,[b.id]),
 pool.query(`SELECT i.*,be.element_id FROM images i LEFT JOIN building_elements be ON be.id=i.building_element_id WHERE i.building_id=$1 ${admin?'':'AND i.approved'} ORDER BY i.is_cover DESC,i.sort_order,i.id`,[b.id])]);
 b.empires=await buildingEmpires(b.id);
 b.aliases=results[0].rows.map(x=>x.alias); ['styles','materials','elements','citations','images'].forEach((key,i)=>b[key]=results[i+1].rows);
 const points=(await pool.query('SELECT storage_key,element_id,label,x::float8,y::float8,note FROM hotspots WHERE building_id=$1 ORDER BY id',[b.id])).rows;
 b.images=b.images.map(x=>({...x,hotspots:points.filter(h=>h.storage_key===x.storage_key),byte_size:Number(x.byte_size),display_url:`/media/${x.storage_key}-1600.webp`,thumbnail_url:`/media/${x.storage_key}-480.webp`}));
 return b;
}
export function listFilters(query) {
 const ids=value=>{if(!value)return [];const values=String(value).split(',');if(values.length>30||values.some(x=>!/^\d+$/.test(x)||Number(x)<1||Number(x)>2147483647))throw Object.assign(new Error('Invalid filter IDs.'),{status:400});return [...new Set(values.map(Number))];};
 const relationship=query.relationship?z.enum(['construction','patronage','addition','restoration','historical_context']).parse(query.relationship):'';
 const states=String(query.states||query.state||'').split(',').map(x=>x.trim()).filter(Boolean);if(states.length>36||states.some(x=>x.length>80||!/^[A-Za-z ]+$/.test(x)))throw Object.assign(new Error('Invalid states.'),{status:400});return {states,relationship,q:String(query.q||'').slice(0,200),sites:ids(query.sites),types:ids(query.types),materials:ids(query.materials),elements:ids(query.elements),empires:ids(query.empires),page:Math.min(100000,Math.max(1,Number.parseInt(query.page)||1)),limit:Math.min(200,Math.max(1,Number.parseInt(query.limit)||12)),sort:['name','oldest','newest'].includes(query.sort)?query.sort:'name'};
}
// Hydrate a catalogue page with a fixed set of queries instead of querying each
// monument separately. All child rows are restricted to the selected page IDs.
export async function cataloguePage(ids,{admin=false}={}) {
 if(!ids.length)return [];
 const values=[ids];
 const queries=[
  [`SELECT b.*,s.name AS site,s.slug AS site_slug,s.district,s.state,s.map_latitude,s.map_longitude,s.map_source_url,t.name AS type FROM buildings b JOIN sites s ON s.id=b.site_id JOIN building_types t ON t.id=b.type_id WHERE b.id=ANY($1::int[]) ${admin?'':"AND b.status='published'"}`,values],
  ['SELECT building_id,alias FROM building_aliases WHERE building_id=ANY($1::int[]) ORDER BY alias',values],
  ['SELECT bs.building_id,s.id,s.name,bs.notes FROM building_styles bs JOIN styles s ON s.id=bs.style_id WHERE bs.building_id=ANY($1::int[]) ORDER BY s.name',values],
  ['SELECT bm.building_id,m.id,m.name,bm.usage_notes AS notes FROM building_materials bm JOIN materials m ON m.id=bm.material_id WHERE bm.building_id=ANY($1::int[]) ORDER BY m.name',values],
  ['SELECT be.building_id,e.id,e.name,e.description,be.description AS notes FROM building_elements be JOIN elements e ON e.id=be.element_id WHERE be.building_id=ANY($1::int[]) ORDER BY e.name',values],
  [`SELECT c.*,s.title,s.url,s.author_or_publisher,CASE WHEN c.building_style_id IS NOT NULL THEN 'style' WHEN c.building_material_id IS NOT NULL THEN 'material' WHEN c.building_element_id IS NOT NULL THEN 'element' END AS target_kind,COALESCE(bs.style_id,bm.material_id,be.element_id) AS taxonomy_id FROM citations c JOIN sources s ON s.id=c.source_id LEFT JOIN building_styles bs ON bs.id=c.building_style_id LEFT JOIN building_materials bm ON bm.id=c.building_material_id LEFT JOIN building_elements be ON be.id=c.building_element_id WHERE c.building_id=ANY($1::int[]) ORDER BY c.id`,values],
  [`SELECT i.*,be.element_id FROM images i LEFT JOIN building_elements be ON be.id=i.building_element_id WHERE i.building_id=ANY($1::int[]) ${admin?'':'AND i.approved'} ORDER BY i.is_cover DESC,i.sort_order,i.id`,values],
  ['SELECT building_id,storage_key,element_id,label,x::float8,y::float8,note FROM hotspots WHERE building_id=ANY($1::int[]) ORDER BY id',values],
  ['SELECT be.*,e.name,e.slug,e.kind,e.date_label,s.title AS source_title,s.url FROM building_empires be JOIN empires e ON e.id=be.empire_id JOIN sources s ON s.id=be.source_id WHERE be.building_id=ANY($1::int[]) ORDER BY be.year_from NULLS LAST,e.name,be.relationship',values]
 ];
 const results=await Promise.all(queries.map(([sql,args])=>pool.query(sql,args)));
 const byBuilding=results.slice(1).map(result=>{const map=new Map();for(const row of result.rows){if(!map.has(row.building_id))map.set(row.building_id,[]);map.get(row.building_id).push(row);}return map;});
 const lookup=new Map(results[0].rows.map(b=>{
  b.aliases=(byBuilding[0].get(b.id)||[]).map(r=>r.alias);
  ['styles','materials','elements','citations'].forEach((key,i)=>b[key]=byBuilding[i+1].get(b.id)||[]);
  const hotspots=byBuilding[6].get(b.id)||[];
  b.images=(byBuilding[5].get(b.id)||[]).map(i=>({...i,hotspots:hotspots.filter(h=>h.storage_key===i.storage_key),byte_size:Number(i.byte_size),display_url:`/media/${i.storage_key}-1600.webp`,thumbnail_url:`/media/${i.storage_key}-480.webp`}));
  b.empires=byBuilding[7].get(b.id)||[];return [b.id,b];
 }));
 return ids.map(id=>lookup.get(id)).filter(Boolean);
}
export async function listBuildings(query,{admin=false}={}) {
 const f=listFilters(query),params=[],where=[];
 const add=value=>{params.push(value);return `$${params.length}`;};
 if(!admin)where.push("b.status='published'");
 if(f.states.length)where.push(`EXISTS(SELECT 1 FROM sites site WHERE site.id=b.site_id AND site.state=ANY(${add(f.states)}::text[]))`);
 if(f.empires.length||f.relationship){const historical=['be.building_id=b.id'];if(f.empires.length)historical.push(`be.empire_id=ANY(${add(f.empires)}::int[])`);if(f.relationship)historical.push(`be.relationship=${add(f.relationship)}`);where.push(`EXISTS(SELECT 1 FROM building_empires be WHERE ${historical.join(' AND ')})`);}
 if(f.q){const p=add(`%${f.q.replace(/[\\%_]/g,'\\$&')}%`);where.push(`(b.name ILIKE ${p} OR EXISTS(SELECT 1 FROM building_aliases a WHERE a.building_id=b.id AND a.alias ILIKE ${p}))`);}
 for(const [key,col]of [['sites','site_id'],['types','type_id']])if(f[key].length)where.push(`b.${col}=ANY(${add(f[key])}::int[])`);
 for(const [key,table,col]of [['materials','building_materials','material_id'],['elements','building_elements','element_id']])if(f[key].length){const p=add(f[key]);where.push(`NOT EXISTS(SELECT 1 FROM unnest(${p}::int[]) required(id) WHERE NOT EXISTS(SELECT 1 FROM ${table} rel WHERE rel.building_id=b.id AND rel.${col}=required.id))`);}
 const predicate=where.length?`WHERE ${where.join(' AND ')}`:'';
 const count=await pool.query(`SELECT count(*)::int AS total FROM buildings b ${predicate}`,params);
 const order={name:'b.name,b.id',oldest:'b.year_from ASC NULLS LAST,b.id',newest:'b.year_from DESC NULLS LAST,b.id'}[f.sort];
 const rows=await pool.query(`SELECT b.id FROM buildings b ${predicate} ORDER BY ${order} LIMIT ${add(f.limit)} OFFSET ${add((f.page-1)*f.limit)}`,params);
 return {items:await cataloguePage(rows.rows.map(x=>x.id),{admin}),total:count.rows[0].total,page:f.page,limit:f.limit};
}
export async function saveBuilding(input,buildingId=null,{coordinates}={}) {
 const b=buildingSchema.parse(input);
 for(const image of b.images.filter(x=>x.approved)){
  const prepared=process.env.VERCEL==='1'
   ? hostedPhotos.has(image.storage_key)
   : await access(`media/display/${image.storage_key}-1600.webp`).then(()=>true,()=>false);
  if(!prepared)throw Object.assign(new Error(`Prepared photograph ${image.storage_key} is missing. Import the file before approving it.`),{status:400});
 }
 return transaction(async client=>{
 const fields=['name','slug','site_id','type_id','summary','history','layout_notes','year_from','year_to','date_label','date_precision','status'];
 let idValue=buildingId;
 if(buildingId){const result=await client.query(`UPDATE buildings SET ${fields.map((x,i)=>`${x}=$${i+1}`).join(',')},updated_at=now() WHERE id=$${fields.length+1} RETURNING id`,[...fields.map(x=>b[x]),buildingId]);if(!result.rowCount)throw Object.assign(new Error('Building not found.'),{status:404});}
 else{
  const columns=[...fields,'latitude','longitude'];
  const values=[...fields.map(field=>b[field]),coordinates?.latitude??null,coordinates?.longitude??null];
  idValue=(await client.query(`INSERT INTO buildings(${columns.join(',')}) VALUES(${columns.map((_,i)=>`$${i+1}`).join(',')}) RETURNING id`,values)).rows[0].id;
 }
 const previous=(await client.query('SELECT storage_key,element_id,label,x::float8,y::float8,note FROM hotspots WHERE building_id=$1',[idValue])).rows;
 const images=b.images.map(im=>({...im,hotspots:im.hotspots??previous.filter(h=>h.storage_key===im.storage_key&&b.elements.some(e=>e.id===h.element_id))}));
 buildingSchema.parse({...b,images});
 for(const table of ['citations','images','building_aliases','building_styles','building_materials','building_elements'])await client.query(`DELETE FROM ${table} WHERE building_id=$1`,[idValue]);
 for(const alias of b.aliases)await client.query('INSERT INTO building_aliases(building_id,alias) VALUES($1,$2)',[idValue,alias]);
 const maps={style:new Map(),material:new Map(),element:new Map()};
 for(const [kind,key,table,col,noteCol]of [['style','styles','building_styles','style_id','notes'],['material','materials','building_materials','material_id','usage_notes'],['element','elements','building_elements','element_id','description']])for(const rel of b[key]){const result=await client.query(`INSERT INTO ${table}(building_id,${col},${noteCol}) VALUES($1,$2,$3) RETURNING id`,[idValue,rel.id,rel.notes]);maps[kind].set(rel.id,result.rows[0].id);}
 for(const c of b.citations){const target=c.target_kind?maps[c.target_kind].get(c.taxonomy_id):null;if(c.target_kind&&!target)throw Object.assign(new Error('Citation target must belong to this building.'),{status:400});await client.query('INSERT INTO citations(building_id,source_id,claim_topic,locator,note,building_style_id,building_material_id,building_element_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[idValue,c.source_id,c.claim_topic,c.locator,c.note,c.target_kind==='style'?target:null,c.target_kind==='material'?target:null,c.target_kind==='element'?target:null]);}
 for(const im of images){const cols=['building_id','building_element_id','storage_key','source_page_url','original_url','author','licence_code','licence_url','caption','alt_text','width','height','byte_size','modification_note','sort_order','is_cover','approved'];const data={...im,building_id:idValue,building_element_id:im.element_id?maps.element.get(im.element_id):null};await client.query(`INSERT INTO images(${cols.join(',')}) VALUES(${cols.map((_,i)=>`$${i+1}`).join(',')})`,cols.map(x=>data[x]));
  for(const h of im.hotspots)await client.query('INSERT INTO hotspots(building_id,storage_key,element_id,label,x,y,note) VALUES($1,$2,$3,$4,$5,$6,$7)',[idValue,im.storage_key,h.element_id,h.label,h.x,h.y,h.note]);
 }
 return idValue;
 });
}
export async function statistics() {
 const count=(await pool.query("SELECT count(*)::int AS buildings,count(DISTINCT site_id)::int AS site_count FROM buildings WHERE status='published'")).rows[0];
 const groups=[['empires',"SELECT e.name,count(DISTINCT b.id)::int AS count FROM empires e JOIN building_empires be ON be.empire_id=e.id JOIN buildings b ON b.id=be.building_id AND b.status='published' GROUP BY e.id ORDER BY count DESC,e.name"],['states',"SELECT s.state AS name,count(b.id)::int AS count FROM sites s JOIN buildings b ON b.site_id=s.id AND b.status='published' GROUP BY s.state ORDER BY s.state"],['sites',"SELECT s.name,count(b.id)::int AS count FROM sites s JOIN buildings b ON b.site_id=s.id AND b.status='published' GROUP BY s.id ORDER BY count DESC,s.name"],['types',"SELECT t.name,count(b.id)::int AS count FROM building_types t JOIN buildings b ON b.type_id=t.id AND b.status='published' GROUP BY t.id ORDER BY count DESC,t.name"],['materials',"SELECT m.name,count(DISTINCT b.id)::int AS count FROM materials m JOIN building_materials bm ON bm.material_id=m.id JOIN buildings b ON b.id=bm.building_id AND b.status='published' GROUP BY m.id ORDER BY count DESC,m.name"],['elements',"SELECT e.name,count(DISTINCT b.id)::int AS count FROM elements e JOIN building_elements be ON be.element_id=e.id JOIN buildings b ON b.id=be.building_id AND b.status='published' GROUP BY e.id ORDER BY count DESC,e.name"]];
 const results=await Promise.all(groups.map(async([key,sql])=>[key,(await pool.query(sql)).rows]));
 return {...count,...Object.fromEntries(results)};
}
