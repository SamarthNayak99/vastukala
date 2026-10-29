import {readFile,access,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile('research/media-manifest.json','utf8'));
const panels=[];let index=0;
for(const image of manifest){const file=`media/display/${image.key}-960.webp`;try{await access(file);}catch{continue;}
 const x=(index%3)*400,y=Math.floor(index/3)*330;
 panels.push({input:await sharp(file).resize(390,290,{fit:'inside'}).extend({top:0,bottom:0,left:0,right:0,background:'#eee'}).png().toBuffer(),left:x,top:y});
 panels.push({input:Buffer.from(`<svg width="390" height="35"><rect width="100%" height="100%" fill="#f5f0e8"/><text x="7" y="23" font-family="Arial" font-size="16">${image.key}</text></svg>`),left:x,top:y+290});index++;
}
await mkdir('.local/qa',{recursive:true});
await sharp({create:{width:1200,height:Math.ceil(index/3)*330,channels:3,background:'#f5f0e8'}}).composite(panels).png().toFile('.local/qa/media-contact-sheet.png');
console.log(`Prepared contact sheet for ${index} photographs.`);
