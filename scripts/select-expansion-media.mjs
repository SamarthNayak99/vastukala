import {readFile,writeFile} from 'node:fs/promises';
import expansion from '../research/expansion.mjs';
const discovered=JSON.parse(await readFile('.local/discovery/results.json','utf8'));
const picks={
 'virupaksha-temple-hampi':[3,1], 'achyutaraya-temple-hampi':[0,5],
 'lotus-mahal-hampi':[0,6], 'queens-bath-hampi':[2,5],
 'mallikarjuna-temple-pattadakal':[0,3], 'sangameshvara-temple-pattadakal':[3,7], 'papanatha-temple-pattadakal':[2,0],
 'galaganatha-temple-pattadakal':[0,4], 'kadasiddheshvara-temple-pattadakal':[0,1], 'jambulinga-temple-pattadakal':[2,0],
 'badami-cave-1':[6,1], 'badami-cave-2':[6,1], 'badami-cave-4':[4,0], 'bhutanatha-temple-badami':[0,1], 'malegitti-shivalaya-badami':[3,0],
 'lad-khan-temple-aihole':[2,0], 'meguti-jain-temple-aihole':[6,1], 'ravana-phadi-cave-aihole':[0,6],
 'hoysaleswara-temple-halebidu':[0,1], 'keshava-temple-somanathapura':[6,0]
};
const explicit={
 'badami-cave-2':['Badami cave 2 view.jpg','7th century Trivikrama, Vishnu avatar Vamana legend in Cave 2, Badami Hindu cave temple Karnataka.jpg'],
 'krishna-temple-hampi':['Frontal view of the Krishna temple in Hampi.JPG','Krishna temple, south eastern mandapa. Vijayanagar c. 1515.JPG'],
 'hazara-rama-temple-hampi':['Hazara rama.jpg','HAZARA RAMA TEMPLE OUTER WALL 1.JPG'],
 'elephant-stables-hampi':['The Elephant Stable in Hamp 02.jpg','Elephants stables.jpg'],
 'hucchimalli-temple-aihole':['Hucchimalli temple Aihole.jpg','6th - 8th century Hucchimalli Gudi Temple in Rekhanagara style, Kartikeya on peacock, Aihole Hindu monuments Karnataka.jpg'],
 'huchappayya-matha-aihole':['7th - 8th century Huchappaya matha temple, exterior view, Aihole Hindu monuments.jpg','7th - 8th century Huchappaya matha temple, Brahma seated on Hamsa ceiling artwork, Aihole Hindu monuments.jpg']
};
let candidates=JSON.parse(await readFile('research/media-candidates.json','utf8'));
let selectedMetadata={};
for(const b of expansion.buildings){
 const files=explicit[b.slug]||picks[b.slug].map(i=>discovered[b.slug][i].file);
 files.forEach((file,index)=>{
  const key=b.slug==='badami-cave-1'&&!index?'badami-cave-1-exterior':b.slug==='badami-cave-2'&&index?'badami-cave-2-relief':b.slug==='lad-khan-temple-aihole'&&!index?'lad-khan-temple-aihole-exterior':`${b.slug}-${index?'detail':'overview'}`;
  const candidate={key,building:b.slug,file,caption:index?`${b.name}, ${b.site}: architectural detail or alternate view`:`${b.name}, ${b.site}: main view`,cover:index===0};
  candidates=candidates.filter(x=>x.key!==key);candidates.push(candidate);
  const metadata=discovered[b.slug]?.find(x=>x.file===file);if(metadata)selectedMetadata[key]=metadata;
 });
}
await writeFile('research/media-candidates.json',JSON.stringify(candidates,null,2)+'\n');
await writeFile('.local/discovery/selected-metadata.json',JSON.stringify(selectedMetadata,null,2));
console.log(`Selected ${expansion.buildings.length*2} photographs for ${expansion.buildings.length} additions.`);
