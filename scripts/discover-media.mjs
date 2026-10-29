import {mkdir,readFile,writeFile} from 'node:fs/promises';
const queries={
 'virupaksha-temple-hampi':'Virupaksha Hampi -Pattadakal',
 'achyutaraya-temple-hampi':'intitle:Achyutaraya -intitle:"Achyutaraya Temple -"',
 'krishna-temple-hampi':'intitle:Krishna intitle:Hampi -intitle:"Hampi -"',
 'hazara-rama-temple-hampi':'intitle:Hazara intitle:Rama -intitle:"Hampi -"',
 'lotus-mahal-hampi':'Lotus Mahal Hampi',
 'elephant-stables-hampi':'intitle:Elephant intitle:Stables -intitle:"Hampi -"',
 'queens-bath-hampi':'Queens bath Hampi',
 'mallikarjuna-temple-pattadakal':'Mallikarjuna temple Pattadakal',
 'sangameshvara-temple-pattadakal':'Sangameshvara Pattadakal',
 'papanatha-temple-pattadakal':'Papanatha Pattadakal',
 'galaganatha-temple-pattadakal':'Galaganatha Pattadakal',
 'kadasiddheshvara-temple-pattadakal':'Kadasiddheshvara Pattadakal',
 'jambulinga-temple-pattadakal':'Jambulinga Pattadakal',
 'badami-cave-1':'Badami cave 1',
 'badami-cave-2':'Badami cave 2',
 'badami-cave-4':'Badami cave 4',
 'bhutanatha-temple-badami':'Bhutanatha Badami',
 'malegitti-shivalaya-badami':'Malegitti Shivalaya',
 'lad-khan-temple-aihole':'intitle:"Lad Khan"',
 'meguti-jain-temple-aihole':'Meguti Jain temple',
 'ravana-phadi-cave-aihole':'Ravana Phadi cave Aihole',
 'hucchimalli-temple-aihole':'intitle:Hucchimalli OR intitle:Huchhimalli OR intitle:Huchimalli',
 'huchappayya-matha-aihole':'intitle:Huchappaya intitle:matha',
 'hoysaleswara-temple-halebidu':'Hoysaleswara temple Halebidu',
 'keshava-temple-somanathapura':'Keshava temple Somanathapura'
};
await mkdir('.local/discovery',{recursive:true});let results={};try{results=JSON.parse(await readFile('.local/discovery/results.json','utf8'));}catch{}
const clean=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
export async function fetchRetry(url){let error;for(let i=0;i<4;i++){try{const r=await fetch(url,{headers:{'User-Agent':'VastukalaCollegeProject/0.2 (architectural research)'},signal:AbortSignal.timeout(40000)});if(r.status===429){await new Promise(resolve=>setTimeout(resolve,15000*(i+1)));continue;}if(!r.ok)throw new Error(`HTTP ${r.status}`);return r;}catch(e){error=e;}}throw error||new Error('Rate limited');}
const jobs=Object.entries(queries);let next=0;
async function worker(){while(next<jobs.length){const[slug,q]=jobs[next++];if(results[slug]?.length){console.log(`Cached ${slug}`);continue;}try{const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',generator:'search',gsrnamespace:'6',gsrsearch:q,gsrlimit:'18',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'500'});const json=await(await fetchRetry(url)).json();results[slug]=Object.values(json.query?.pages||{}).sort((a,b)=>a.index-b.index).flatMap(page=>{const info=page.imageinfo?.[0],m=info?.extmetadata;if(!info||!/\.(jpg|jpeg|png)$/i.test(page.title)||Math.max(info.width,info.height)<2400)return[];const licence=clean(m.LicenseShortName?.value);if(!/^(CC BY(-SA)? [\d.]+|CC0|Public domain)/.test(licence))return[];return[{file:page.title.replace(/^File:/,''),source_page_url:info.descriptionurl,original_url:info.url,thumbnail_url:info.thumburl,author:clean(m.Artist?.value),licence_code:licence,licence_url:clean(m.LicenseUrl?.value)||'https://creativecommons.org/publicdomain/zero/1.0/',width:info.width,height:info.height,byte_size:info.size,description:clean(m.ImageDescription?.value).slice(0,1400)}];}).slice(0,8);console.log(`${slug}: ${results[slug].length} options`);await writeFile('.local/discovery/results.json',JSON.stringify(results,null,2));}catch(e){console.error(`${slug}: ${e.message}`);process.exitCode=1;}}}
await worker();
