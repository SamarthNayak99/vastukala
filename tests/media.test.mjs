import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';

test('image preparation supports JPEG, PNG and WebP inputs without enlargement',async()=>{
 for(const format of ['jpeg','png','webp']){
  const input=await sharp({create:{width:1200,height:800,channels:3,background:'#984930'}}).toFormat(format).toBuffer();
  const {info}=await sharp(input).rotate().resize({width:480,withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true});
  assert.equal(info.format,'webp');assert.equal(info.width,480);assert.equal(info.height,320);
 }
 const small=await sharp({create:{width:120,height:80,channels:3,background:'white'}}).png().toBuffer();
 const {info}=await sharp(small).resize({width:480,withoutEnlargement:true}).webp().toBuffer({resolveWithObject:true});
 assert.equal(info.width,120);assert.equal(info.height,80);
});

test('portrait EXIF orientation is applied before preparing a display image',async()=>{
 const input=await sharp({create:{width:40,height:80,channels:3,background:'white'}}).jpeg().withMetadata({orientation:6}).toBuffer();
 const {info}=await sharp(input).rotate().resize({width:40,withoutEnlargement:true}).webp().toBuffer({resolveWithObject:true});
 assert.equal(info.width,40);assert.equal(info.height,20);
});

test('the patched image renderer can still render the project’s SVG diagram format',async()=>{
 const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#984930"/><text x="10" y="40">PK / FK</text></svg>');
 const {info}=await sharp(svg).png().toBuffer({resolveWithObject:true});
 assert.equal(info.format,'png');assert.equal(info.width,120);assert.equal(info.height,80);
});
