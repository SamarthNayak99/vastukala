import {readFile,writeFile} from 'node:fs/promises';
const path='client/src/main.jsx';let source=await readFile(path,'utf8');
const replacements=[
 ["import './styles.css';","import './styles.css';\nimport './collection.css';"],
 ["useData('/buildings?limit=5&sort=newest')","useData('/buildings?limit=48&sort=newest')"],
 ["records.find(x=>x.site==='Hampi')","records.find(x=>x.slug==='vitthala-temple-hampi')"],
 ["['Hampi','Belur','Pattadakal','Badami','Aihole'].map((name,i)","(stats.data?.sites||[]).map(x=>x.name).map((name,i)"],
 ["records.slice(0,3).map(b=>","records.filter((b,i,all)=>all.findIndex(x=>x.site_id===b.site_id)===i).slice(0,3).map(b=>"],
 ["We begin with selected monuments at Hampi, Belur, Pattadakal, Badami and Aihole. Ancient and medieval architecture both belong here. Our first collection is a pilot, with more records to follow as research and photographs are reviewed.","The collection brings together monuments at Hampi, Belur, Pattadakal, Badami, Aihole, Halebidu and Somanathapura. Ancient and medieval architecture both belong here. Each building is documented individually, with further research and photographs added as they are reviewed."]
];
for(const[from,to]of replacements){if(source.includes(to))continue;if(!source.includes(from))throw new Error(`Cannot locate UI text: ${from}`);source=source.replace(from,to);}
await writeFile(path,source);
