import {transaction} from '../server/db.mjs';
import points from '../research/hotspots.mjs';
export async function seedHotspots(){
 await transaction(async client=>{
  // Serializes simultaneous startups and only seeds once, including after restores.
  await client.query("SELECT pg_advisory_xact_lock(hashtext('vastukala:hotspots'))");
  if((await client.query("SELECT 1 FROM seed_tasks WHERE name='hotspots-v2'")).rowCount)return;
  const previous=(await client.query("SELECT 1 FROM seed_tasks WHERE name='hotspots-v1'")).rowCount;
  const selected=previous?points.filter(p=>p.version===2):points;
  for(const p of selected){
   const match=await client.query(`SELECT b.id,be.element_id FROM buildings b JOIN images i ON i.building_id=b.id
   JOIN building_elements be ON be.building_id=b.id JOIN elements e ON e.id=be.element_id
   WHERE b.slug=$1 AND i.storage_key=$2 AND e.name=$3
   AND EXISTS(SELECT 1 FROM citations c WHERE c.building_id=b.id AND c.building_element_id=be.id)`,[p.building,p.storage_key,p.element]);
   if(match.rowCount!==1)throw new Error(`Cannot seed cited image annotation: ${p.building} / ${p.element}`);
   const b=match.rows[0];await client.query('INSERT INTO hotspots(building_id,storage_key,element_id,label,x,y,note) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(building_id,storage_key,element_id) DO NOTHING',[b.id,p.storage_key,b.element_id,p.label,p.x,p.y,p.note]);
  }
  await client.query("INSERT INTO seed_tasks(name) VALUES('hotspots-v2')");
  console.log(`Prepared ${selected.length} reviewed annotations; administrator edits are preserved.`);
 });
}
