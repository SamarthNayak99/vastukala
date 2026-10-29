import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
const discovered=JSON.parse(await readFile('.local/discovery/results.json','utf8'));
const replacement=discovered['badami-cave-1'].find(x=>x.file==='Badami Cave Temples (1).JPG');
const oldKey='badami-cave-1-overview',key='badami-cave-1-exterior';
const rejectedKeys=[oldKey,'badami-cave-2-detail','lad-khan-temple-aihole-overview'];
const candidates=JSON.parse(await readFile('research/media-candidates.json','utf8'));
const index=candidates.findIndex(x=>x.key===oldKey);
if(index>=0)candidates[index]={key,building:'badami-cave-1',file:replacement.file,caption:'Badami Cave 1, Badami: entrance cut into the sandstone cliff',cover:true};
const second=candidates.findIndex(x=>x.key==='badami-cave-2-detail');
if(second>=0)candidates[second]={key:'badami-cave-2-relief',building:'badami-cave-2',file:'7th century Trivikrama, Vishnu avatar Vamana legend in Cave 2, Badami Hindu cave temple Karnataka.jpg',caption:'Badami Cave 2, Badami: Trivikrama relief',cover:false,element:'Sculptural relief'};
const lad=discovered['lad-khan-temple-aihole'].find(x=>x.file==='Lad Khan Temple Aihole.jpg');
const ladIndex=candidates.findIndex(x=>x.key==='lad-khan-temple-aihole-overview');
if(ladIndex>=0)candidates[ladIndex]={key:'lad-khan-temple-aihole-exterior',building:'lad-khan-temple-aihole',file:lad.file,caption:'Lad Khan Temple, Aihole: entrance porch and upper shrine',cover:true};
await writeFile('research/media-candidates.json',JSON.stringify(candidates,null,2)+'\n');
const metadata=JSON.parse(await readFile('.local/discovery/selected-metadata.json','utf8'));
metadata[key]=replacement;await writeFile('.local/discovery/selected-metadata.json',JSON.stringify(metadata,null,2));
metadata['lad-khan-temple-aihole-exterior']=lad;await writeFile('.local/discovery/selected-metadata.json',JSON.stringify(metadata,null,2));
// The running downloader owns the manifest. Remove the rejected entry after it exits.
if(process.argv.includes('--finalize')){
 const manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));
 await writeFile('research/media-manifest.json',JSON.stringify(manifest.filter(x=>!rejectedKeys.includes(x.key)),null,2)+'\n');
 await mkdir('.local/qa/rejected',{recursive:true});
 for(const rejected of rejectedKeys)for(const file of [`media/originals/${rejected}.original`,...[480,960,1600,2400].map(width=>`media/display/${rejected}-${width}.webp`)]){
  const source=path.resolve(file),target=path.resolve('.local/qa/rejected',path.basename(file));
  if([source,target].some(value=>path.relative(process.cwd(),value).startsWith('..')))throw new Error('Media archive path escaped the workspace');
  try{await rename(source,target);}catch(error){if(error.code!=='ENOENT')throw error;}
 }
}
console.log('Selected reviewed replacements for Cave 1, Cave 2 and Lad Khan Temple.');
