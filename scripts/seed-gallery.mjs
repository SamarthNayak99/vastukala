import {access} from 'node:fs/promises';
import {transaction} from '../server/db.mjs';

export async function seedGallery(manifest) {
 const galleries=new Map();
 for(const image of manifest){
  if(!image.approved||image.cover||!image.key.startsWith('gallery-'))continue;
  const images=galleries.get(image.building)||[];
  images.push(image);
  galleries.set(image.building,images);
 }
 for(const [slug,images] of galleries){
  await transaction(async client=>{
   const {rows:[building]}=await client.query('SELECT id FROM buildings WHERE slug=$1 FOR UPDATE',[slug]);
   if(!building)return;
   for(const image of images){
    const task=`gallery-photo:${image.storage_key}`;
    const applied=await client.query('SELECT 1 FROM seed_tasks WHERE name=$1',[task]);
    if(applied.rowCount)continue;
    await access(`media/display/${image.storage_key}-1600.webp`);
    await client.query(`
     INSERT INTO images(building_id,storage_key,source_page_url,original_url,author,licence_code,licence_url,
      caption,alt_text,width,height,byte_size,modification_note,sort_order,is_cover,approved)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,
      (SELECT COALESCE(MAX(sort_order),-1)+1 FROM images WHERE building_id=$1),false,true)
     ON CONFLICT DO NOTHING`,[
      building.id,image.storage_key,image.source_page_url,image.original_url,image.author,image.licence_code,
      image.licence_url,image.caption,image.width,image.height,image.byte_size,image.modification_note
    ]);
    await client.query('INSERT INTO seed_tasks(name) VALUES($1)',[task]);
   }
  });
 }
}
