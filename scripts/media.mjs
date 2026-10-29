import { mkdir,readFile,writeFile,access } from 'node:fs/promises';
import sharp from 'sharp';
const candidates=JSON.parse(await readFile('research/media-candidates.json','utf8'));
await mkdir('media/originals',{recursive:true}); await mkdir('media/display',{recursive:true});
let manifest=[];try{manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));}catch{}
let discovered={};try{discovered=JSON.parse(await readFile('.local/discovery/selected-metadata.json','utf8'));}catch{}
const clean=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
let uploadRetryAt=0;try{uploadRetryAt=JSON.parse(await readFile('.local/media-rate-limit.json','utf8')).uploadRetryAt||0;}catch{}
async function fetchChecked(url){let last;for(let attempt=0;attempt<4;attempt++){try{
 const upload=new URL(url).hostname==='upload.wikimedia.org';
 if(upload&&Date.now()<uploadRetryAt){console.log(`Respecting Wikimedia Retry-After until ${new Date(uploadRetryAt).toISOString()}`);await new Promise(resolve=>setTimeout(resolve,uploadRetryAt-Date.now()));}
 const response=await fetch(url,{headers:{'User-Agent':'VastukalaCollegeProject/0.2 (educational architectural archive)'},signal:AbortSignal.timeout(180000)});
 if(response.status===429){const seconds=Number(response.headers.get('retry-after'))||600;uploadRetryAt=Date.now()+seconds*1000;await writeFile('.local/media-rate-limit.json',JSON.stringify({uploadRetryAt}));await response.body?.cancel();continue;}
 if(!response.ok)throw new Error(`${response.status} ${url}`);return response;
 }catch(error){last=error;console.log(`Retry ${attempt+1}: ${new URL(url).hostname} (${error.cause?.code||error.name})`);if(attempt<3)await new Promise(resolve=>setTimeout(resolve,5000*(attempt+1)));}}throw last||new Error('Rate limited');}
async function downloadOriginal(url){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{return Buffer.from(await(await fetchChecked(url)).arrayBuffer());}
  catch(error){last=error;if(attempt<2){console.log(`Retry interrupted image transfer ${attempt+1}`);await new Promise(resolve=>setTimeout(resolve,5000));}}
 }
 throw last;
}
let cursor=0,writeQueue=Promise.resolve();
async function worker(){while(cursor<candidates.length){const item=candidates[cursor++];
 try {
  let record=manifest.find(x=>x.key===item.key);
  if(record){record.cover=item.cover;record.caption=item.caption;record.element=item.element;}
  if(!record) {
   if(discovered[item.key]) {
    const metadata=discovered[item.key];
    record={...item,...metadata,approved:false,storage_key:item.key,modification_note:'Resized and converted to WebP for display; originals retained.'};
    delete record.description;delete record.thumbnail_url;
   } else {
   const api=new URL('https://commons.wikimedia.org/w/api.php');api.search=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|size|extmetadata',titles:`File:${item.file}`});
   const data=await(await fetchChecked(api)).json();const info=Object.values(data.query.pages)[0].imageinfo?.[0];
   if(!info)throw new Error(`No image info: ${item.file}`);
   const metadata=info.extmetadata;const licence=clean(metadata.LicenseShortName?.value);
   if(!/^(CC BY(-SA)? [\d.]+|CC0|Public domain)/.test(licence))throw new Error(`Review licence manually: ${licence}`);
   record={...item,source_page_url:info.descriptionurl,original_url:info.url,author:clean(metadata.Artist?.value),licence_code:licence,licence_url:clean(metadata.LicenseUrl?.value)||'https://creativecommons.org/publicdomain/zero/1.0/',width:info.width,height:info.height,byte_size:info.size,approved:false,storage_key:item.key,modification_note:'Resized and converted to WebP for display; originals retained.'};
   }
  }
  const original=`media/originals/${item.key}.original`;
  let downloaded=false;
  try{await access(original);}catch{const downloadUrl=new URL(record.original_url);downloadUrl.search='';await writeFile(original,await downloadOriginal(downloadUrl.toString()));downloaded=true;}
  for(const width of [480,960,1600,2400]) {const output=`media/display/${item.key}-${width}.webp`;try{await access(output);}catch{await sharp(original).rotate().resize({width,withoutEnlargement:true}).webp({quality:88}).toFile(output);}}
  if(!manifest.some(x=>x.key===record.key))manifest.push(record);
  await(writeQueue=writeQueue.then(()=>writeFile('research/media-manifest.json',JSON.stringify(manifest,null,2)+'\n')));
  console.log(`Prepared ${item.key}: ${record.width} × ${record.height}; ${record.licence_code}`);
  // Leave space between new downloads to reduce pressure on the public media host.
  if(downloaded)await new Promise(resolve=>setTimeout(resolve,30000));
 }catch(error){console.error(`${item.key}: ${error.message}`);process.exitCode=1;}
}}
await worker();
