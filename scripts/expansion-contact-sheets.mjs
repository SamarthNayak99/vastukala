import {readFile,mkdir,access} from 'node:fs/promises';
import sharp from 'sharp';
import expansion from '../research/expansion.mjs';
const manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));
const slugs=new Set(expansion.buildings.map(x=>x.slug));
const photos=[];for(const im of manifest.filter(x=>slugs.has(x.building))){try{await access(`media/display/${im.storage_key}-960.webp`);photos.push(im);}catch{}}
await mkdir('.local/qa/expansion',{recursive:true});
for(let start=0;start<photos.length;start+=6){const batch=photos.slice(start,start+6),composite=[];
 for(let i=0;i<batch.length;i++){const im=batch[i],x=i%3*400,y=Math.floor(i/3)*340;
  composite.push({input:await sharp(`media/display/${im.storage_key}-960.webp`).resize(390,280,{fit:'contain',background:'#f5f0e8'}).png().toBuffer(),left:x,top:y});
  const text=im.key.match(/.{1,38}/g)||[];
  composite.push({input:Buffer.from(`<svg width="390" height="60"><rect width="100%" height="100%" fill="#f5f0e8"/>${text.map((line,j)=>`<text x="5" y="${19+j*18}" font-family="Arial" font-size="13">${line}</text>`).join('')}</svg>`),left:x,top:y+280});
 }
 const output=`.local/qa/expansion/sheet-${String(start/6+1).padStart(2,'0')}.png`;
 await sharp({create:{width:1200,height:Math.ceil(batch.length/3)*340,channels:3,background:'#f5f0e8'}}).composite(composite).png().toFile(output);
 console.log(`${output}: ${batch.map(x=>x.key).join(', ')}`);
}
console.log(`${photos.length} expansion photographs available for visual review.`);
