import {readFile,writeFile} from 'node:fs/promises';
const candidates=JSON.parse(await readFile('research/media-candidates.json','utf8'));
const selected=JSON.parse(await readFile('.local/discovery/selected-metadata.json','utf8'));
const manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));
const missing=candidates.filter(x=>!selected[x.key]&&!manifest.some(y=>x.key===y.key));
if(!missing.length){console.log('All photograph metadata is available.');process.exit(0);}
const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|size|extmetadata',titles:missing.map(x=>`File:${x.file}`).join('|')});
const response=await fetch(url,{headers:{'User-Agent':'VastukalaCollegeProject/0.2 (educational architectural archive)'},signal:AbortSignal.timeout(45000)});
if(!response.ok)throw new Error(`Metadata request: HTTP ${response.status}`);
const json=await response.json();const clean=v=>String(v||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
for(const page of Object.values(json.query.pages)){const info=page.imageinfo?.[0];if(!info)continue;const candidate=missing.find(x=>x.file.replace(/_/g,' ')===page.title.replace(/^File:/,'').replace(/_/g,' '));if(!candidate)continue;const m=info.extmetadata,licence=clean(m.LicenseShortName?.value);if(!/^(CC BY(-SA)? [\d.]+|CC0|Public domain)/.test(licence))throw new Error(`Check licence: ${licence}`);selected[candidate.key]={file:candidate.file,source_page_url:info.descriptionurl,original_url:info.url,author:clean(m.Artist?.value),licence_code:licence,licence_url:clean(m.LicenseUrl?.value)||'https://creativecommons.org/publicdomain/zero/1.0/',width:info.width,height:info.height,byte_size:info.size};}
await writeFile('.local/discovery/selected-metadata.json',JSON.stringify(selected,null,2));
console.log(`Fetched metadata for ${missing.filter(x=>selected[x.key]).length} photographs in one request.`);
