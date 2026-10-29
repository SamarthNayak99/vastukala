// Run only after every contact sheet has been visually inspected.
import {readFile,writeFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import expansion from '../research/expansion.mjs';
const slugs=new Set(expansion.buildings.map(x=>x.slug));
const captions={
 'virupaksha-temple-hampi':['Temple gateway and stepped tank','Gateway towers seen from the inner courtyard'],
 'achyutaraya-temple-hampi':['Gateway and pillared court','Temple precinct viewed from the surrounding hillside'],
 'krishna-temple-hampi':['Gateway and pillared temple entrance','The carved south-eastern mandapa'],
 'hazara-rama-temple-hampi':['Temple entrance and enclosure wall','Sculptural bands on the enclosure wall'],
 'lotus-mahal-hampi':['Pavilion in its garden setting','Alternate view of the arched pavilion and tiered roof'],
 'elephant-stables-hampi':['Domed stable range and surrounding grounds','Arched entrances and varied domed roofs'],
 'queens-bath-hampi':['Arched corridor inside the bathhouse','Ornamented arches opening toward the bathing court'],
 'mallikarjuna-temple-pattadakal':['Temple exterior and tiered tower','Carved figural panel on the temple'],
 'sangameshvara-temple-pattadakal':['Hall and tower seen from the entrance side','Rear exterior and tiered superstructure'],
 'papanatha-temple-pattadakal':['Temple exterior and curving tower','Long side elevation with carved wall panels'],
 'galaganatha-temple-pattadakal':['Approach to the shrine and curving tower','Alternate exterior view of the shrine superstructure'],
 'kadasiddheshvara-temple-pattadakal':['Temple in its landscaped setting','Closer exterior view of the tower and shrine wall'],
 'badami-cave-1':['Entrance cut into the sandstone cliff','Pillared verandah and decorated ceiling'],
 'badami-cave-2':['Verandah with carved ceiling and wall panels','Trivikrama relief'],
 'badami-cave-4':['Rock-cut entrance and pillars','Verandah and Jain figural panels'],
 'bhutanatha-temple-badami':['Principal temple and adjoining shrines beside the lake','Temple porch and its lakeside setting'],
 'jambulinga-temple-pattadakal':['Shrine, tower and foreground platforms','Closer view of the shrine walls and tower'],
 'malegitti-shivalaya-badami':['Temple viewed from the rocky hillside','Frontal view of the porch and tower'],
 'lad-khan-temple-aihole':['Entrance porch and upper shrine','Interior pillars and pierced stone window'],
 'meguti-jain-temple-aihole':['Temple on Meguti hill','Pillared entrance porch and shrine'],
 'ravana-phadi-cave-aihole':['Rock-cut entrance and forecourt','Dancing Shiva relief inside the cave'],
 'hucchimalli-temple-aihole':['Porch, shrine and curving tower','Figural ceiling relief'],
 'huchappayya-matha-aihole':['Exterior entrance and hall','Carved ceiling panel'],
 'hoysaleswara-temple-halebidu':['Temple entrance and sculpted platform','Pierced stone screens and carved exterior'],
 'keshava-temple-somanathapura':['Temple towers and raised platform','Sculpted figure on the outer wall']
};
const depictedElements={
 'virupaksha-temple-hampi-detail':'Gopuram',
 'hazara-rama-temple-hampi-detail':'Sculptural relief',
 'mallikarjuna-temple-pattadakal-detail':'Sculptural relief',
 'badami-cave-2-relief':'Sculptural relief',
 'ravana-phadi-cave-aihole-detail':'Sculptural relief',
 'queens-bath-hampi-detail':'Arch'
};
const manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));
const candidates=JSON.parse(await readFile('research/media-candidates.json','utf8'));
assert.equal(manifest.length,59,'All photographs must finish downloading before approval');
for(const building of expansion.buildings){
 const images=manifest.filter(x=>x.building===building.slug);assert.equal(images.length,2,building.slug);
 for(const image of images){
  for(const width of [480,960,1600,2400])await access(`media/display/${image.storage_key}-${width}.webp`);
  assert.ok(image.author&&image.licence_url&&image.source_page_url);
  assert.match(image.licence_code,/^(CC BY(-SA)? [\d.]+|CC0|Public domain)/);
  const text=captions[building.slug]?.[image.cover?0:1];
  const place=building.site[0].toUpperCase()+building.site.slice(1);
  image.caption=text?`${building.name}, ${place}: ${text}`:image.caption.replace(`, ${building.site}:`,`, ${place}:`);
  candidates.find(x=>x.key===image.key).caption=image.caption;
  const element=depictedElements[image.key];
  if(element){assert.ok(building.elements.some(x=>x.name===element));image.element=element;candidates.find(x=>x.key===image.key).element=element;}
  image.approved=true;image.reviewed_on='2026-10-28';
  image.review_note='Source-page identity and attribution checked; subject and display quality visually reviewed using local contact sheets.';
 }
}
await writeFile('research/media-candidates.json',JSON.stringify(candidates,null,2)+'\n');
await writeFile('research/media-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Recorded review for 50 expansion photographs.');
