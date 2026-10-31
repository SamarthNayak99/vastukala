import {seedIndiaEvidence} from './seed-india-evidence.mjs';
import {seedConservation} from './seed-conservation.mjs';
import {seedHeritage} from './seed-heritage.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pool} from '../server/db.mjs';
import {saveBuilding} from '../server/catalogue.mjs';
import {loadDataset} from '../research/dataset.mjs';
import {seedHotspots} from './seed-hotspots.mjs';
export async function seed() {
 const pilot=await loadDataset();
 let media=[];try{media=JSON.parse(await readFile('research/media-manifest.json','utf8'));}catch{}
 const sources=new Map(),sites=new Map();
 for(const source of pilot.sources){const result=await pool.query('INSERT INTO sources(title,author_or_publisher,url,accessed_on) VALUES($1,$2,$3,$4) ON CONFLICT(url) DO UPDATE SET url=excluded.url RETURNING id',[source.title,source.publisher,source.url,pilot.researchedOn]);sources.set(source.key,result.rows[0].id);}
 for(const site of pilot.sites){const result=await pool.query('INSERT INTO sites(name,slug,locality,district,overview,state,map_latitude,map_longitude,map_source_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(slug) DO UPDATE SET slug=excluded.slug RETURNING id',[site.name,site.slug,site.locality,site.district,site.overview,site.state||'Karnataka',site.latitude??null,site.longitude??null,site.map_source_url??null]);sites.set(site.slug,result.rows[0].id);}
 async function category(table,name,description=''){return(await pool.query(`INSERT INTO ${table}(name,description) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`,[name,description])).rows[0].id;}
 for(const b of pilot.buildings){
  if((await pool.query('SELECT id FROM buildings WHERE slug=$1',[b.slug])).rowCount){console.log(`Preserved existing ${b.slug}`);continue;}
  const payload={...b,site_id:sites.get(b.site),type_id:await category('building_types',b.type),styles:[],materials:[],elements:[],citations:b.citations.map(c=>({source_id:sources.get(c.source),claim_topic:c.topic,locator:c.locator,note:c.note||''})),images:[],status:'draft'};
  for(const [key,kind]of [['styles','style'],['materials','material'],['elements','element']])for(const rel of b[key]){const id=await category(key,rel.name,rel.description||'');payload[key].push({id,notes:rel.notes});payload.citations.push({source_id:sources.get(rel.source),claim_topic:rel.name,locator:rel.locator,note:rel.notes,target_kind:kind,taxonomy_id:id});}
  payload.images=media.filter(im=>im.building===b.slug).map((im,index)=>({storage_key:im.storage_key,source_page_url:im.source_page_url,original_url:im.original_url,author:im.author,licence_code:im.licence_code,licence_url:im.licence_url,caption:im.caption,alt_text:im.caption,width:im.width,height:im.height,byte_size:im.byte_size,modification_note:im.modification_note,sort_order:index,is_cover:im.cover,approved:im.approved,element_id:im.element?payload.elements[b.elements.findIndex(e=>e.name===im.element)]?.id||null:null}));
  if(payload.images.some(x=>x.is_cover&&x.approved))payload.status='published';
  await saveBuilding(payload);console.log(`Seeded ${b.slug} (${payload.status})`);
 }
 await seedHotspots();await seedHeritage();await seedConservation();await seedIndiaEvidence();
}
if(process.argv[1]===path.resolve('scripts/seed.mjs')){try{await seed();}finally{await pool.end();}}
