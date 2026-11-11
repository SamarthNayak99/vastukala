import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {pool} from '../server/db.mjs';
import {getBuilding,listBuildings,statistics} from '../server/catalogue.mjs';
import expansion from '../research/expansion.mjs';
try{
 const expected={Hampi:8,Pattadakal:7,Badami:6,Aihole:6,Belur:1,Halebidu:1,Somanathapura:1};
 const catalogue=await listBuildings({limit:120,states:'Karnataka'});
 const original=catalogue.items.filter(b=>Object.hasOwn(expected,b.site));
 assert.equal(original.length,30,'Expected all 30 original monuments to be published');
 const stats=await statistics();
 for(const[name,count]of Object.entries(expected))assert.equal(stats.sites.find(x=>x.name===name)?.count,count,`${name} count`);
 for(const entry of expansion.buildings){const building=await getBuilding(entry.slug);assert.ok(building,entry.slug);assert.equal(building.images.filter(x=>!x.storage_key.startsWith('gallery-')).length,2,`${entry.slug} original gallery`);assert.ok(building.images.some(x=>x.is_cover));assert.ok(building.citations.length);assert.ok(building.elements.length);}
 const backups=(await readdir('.local/backups')).filter(x=>/^catalogue-\d+\.json$/.test(x)).sort().reverse();
 let before;
 for(const file of backups){const snapshot=JSON.parse(await readFile(`.local/backups/${file}`,'utf8'));if(snapshot.tables.buildings.length===5){before=snapshot;break;}}
 assert.ok(before,'A pre-expansion five-building backup is required for the preservation check');
 for(const table of ['buildings','building_aliases','building_styles','building_materials','building_elements','citations','images']){
  const old=before.tables[table];if(!old.length)continue;
  const current=(await pool.query(`SELECT * FROM ${table} WHERE id=ANY($1::int[]) ORDER BY id`,[old.map(x=>x.id)])).rows;
  assert.equal(JSON.stringify(current),JSON.stringify(old),`Existing ${table} records changed`);
 }
 const photos=(await pool.query("SELECT count(*)::int AS n FROM images WHERE approved AND storage_key NOT LIKE 'gallery-%' AND building_id=ANY($1::int[])",[original.map(b=>b.id)])).rows[0].n;
 assert.equal(photos,59,'All 59 selected photographs should be reviewed and imported');
 console.log(`Verified ${original.length} published monuments across the original 7 Karnataka sites with ${photos} approved photographs. Existing records preserved.`);
}finally{await pool.end();}
