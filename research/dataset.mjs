import {readFile} from 'node:fs/promises';
import expansion from './expansion.mjs';
export async function loadDataset(){const pilot=JSON.parse(await readFile(new URL('./pilot.json',import.meta.url),'utf8'));const india=JSON.parse(await readFile(new URL('./india.json',import.meta.url),'utf8'));return {researchedOn:india.researchedOn,sources:[...pilot.sources,...expansion.sources,...india.sources],sites:[...pilot.sites,...expansion.sites,...india.sites],buildings:[...pilot.buildings,...expansion.buildings,...india.buildings]};}
