import {readFile} from 'node:fs/promises';
import {transaction} from '../server/db.mjs';
export async function seedIndiaEvidence(){
 const batches=await Promise.all(['india','india-100'].map(async name=>{
  const [dataset,events,points]=await Promise.all(['','-events','-hotspots'].map(async suffix=>
   JSON.parse(await readFile(`research/${name}${suffix}.json`,'utf8'))
  ));
  return {dataset,events,points};
 }));
 await transaction(async c=>{
  await c.query("SELECT pg_advisory_xact_lock(hashtext('vastukala:india-evidence'))");
  for(const {dataset,events,points} of batches)for(const b of dataset.buildings){
   const task='india-evidence-v1:'+b.slug;
   if((await c.query('SELECT 1 FROM seed_tasks WHERE name=$1',[task])).rowCount)continue;
   const row=(await c.query("SELECT id FROM buildings WHERE slug=$1 AND status='published'",[b.slug])).rows[0];
   const annotations=points.filter(p=>p.building===b.slug);
   if(!row||!annotations.length)continue;
   for(const event of events.filter(e=>e.building===b.slug)){
    const source=dataset.sources.find(s=>s.key===event.source);if(!source)throw new Error('Unknown India event source: '+event.source);
    const sid=(await c.query('SELECT id FROM sources WHERE url=$1',[source.url])).rows[0]?.id;if(!sid)throw new Error('Missing event source');
    await c.query('INSERT INTO building_events(building_id,kind,title,description,year_from,year_to,precision,source_id,locator) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[row.id,event.kind,event.title,event.description,event.year_from,event.year_to,event.precision,sid,event.locator]);
   }
   for(const p of annotations){
    const match=(await c.query(`SELECT be.element_id FROM building_elements be JOIN elements e ON e.id=be.element_id JOIN images i ON i.building_id=be.building_id WHERE be.building_id=$1 AND e.name=$2 AND i.storage_key=$3 AND i.approved AND EXISTS(SELECT 1 FROM citations c WHERE c.building_element_id=be.id AND c.building_id=be.building_id)`,[row.id,p.element,p.storage_key])).rows;
    if(match.length!==1)throw new Error('Unverified India image-element relationship: '+b.slug);
    await c.query('INSERT INTO hotspots(building_id,storage_key,element_id,label,x,y,note) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(building_id,storage_key,element_id) DO NOTHING',[row.id,p.storage_key,match[0].element_id,p.label,p.x,p.y,p.note]);
   }
   await c.query('INSERT INTO seed_tasks(name) VALUES($1)',[task]);
  }
 });
}
