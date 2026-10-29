import {readFile} from 'node:fs/promises';
import expansion from './expansion.mjs';
export async function loadDataset(){const pilot=JSON.parse(await readFile(new URL('./pilot.json',import.meta.url),'utf8'));return {researchedOn:expansion.researchedOn,sources:[...pilot.sources,...expansion.sources],sites:[...pilot.sites,...expansion.sites],buildings:[...pilot.buildings,...expansion.buildings]};}
