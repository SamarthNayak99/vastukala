import {copyFile, mkdir, readFile,writeFile} from 'node:fs/promises';

const photos = JSON.parse(await readFile('research/media-manifest.json', 'utf8'));
await mkdir('client/dist/media', {recursive: true});
const mediaOrigin=new URL(process.env.MEDIA_BASE_URL||'https://vastukala.vercel.app/media/');
if(mediaOrigin.protocol!=='https:')throw new Error('MEDIA_BASE_URL must use HTTPS.');
if(!mediaOrigin.pathname.endsWith('/'))mediaOrigin.pathname+='/';
const files=photos.filter(photo=>photo.approved).flatMap(({storage_key})=>{
 if(!/^[a-z0-9-]+$/.test(storage_key))throw new Error('Invalid approved photograph storage key.');
 return [480,960,1600,2400].map(width=>`${storage_key}-${width}.webp`);
});
let cursor=0,downloaded=0;
await Promise.all(Array.from({length:6},async()=>{
 while(cursor<files.length){
  const file=files[cursor++];
  try {
   await copyFile(`media/display/${file}`, `client/dist/media/${file}`);
  } catch (error) {
   if (error.code !== 'ENOENT') throw error;
   // Git checkouts omit the prepared WebP files. Reuse the already-published
   // approved display copy; original authorship and licence stay in the manifest.
   let complete=false,last;
   for(let attempt=0;attempt<3&&!complete;attempt++){
    try{
     const response=await fetch(new URL(file,mediaOrigin),{signal:AbortSignal.timeout(30000)});
     if(!response.ok||!response.headers.get('content-type')?.includes('image/webp')){
      await response.body?.cancel();throw new Error(`HTTP ${response.status}`);
     }
     const bytes=Buffer.from(await response.arrayBuffer());
     if(!bytes.length)throw new Error('Empty photograph');
     await writeFile(`client/dist/media/${file}`,bytes);downloaded++;complete=true;
    }catch(e){last=e;}
   }
   if(!complete)throw new Error(`Approved photo ${file} is unavailable (${last?.message}). Prepare it with npm run media:fetch and publish it from the local workspace first.`);
  }
 }
}));
console.log(`Packaged ${files.length} approved photograph sizes for Vercel (${downloaded} from the published archive).`);
