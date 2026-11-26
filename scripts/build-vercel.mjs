import {copyFile, mkdir, readFile} from 'node:fs/promises';

const photos = JSON.parse(await readFile('research/media-manifest.json', 'utf8'));
await mkdir('client/dist/media', {recursive: true});
for (const {storage_key} of photos.filter(photo => photo.approved)) {
 for (const width of [480, 960, 1600, 2400]) {
  const file = `${storage_key}-${width}.webp`;
  try {
   await copyFile(`media/display/${file}`, `client/dist/media/${file}`);
  } catch (error) {
   if (error.code !== 'ENOENT') throw error;
   throw new Error(`Missing ${file}. Prepare photographs with npm run media:fetch before deploying.`);
  }
 }
}
console.log('Packaged approved gallery photographs for Vercel.');
