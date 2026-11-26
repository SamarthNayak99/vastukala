import {readFile} from 'node:fs/promises';
import expansion from './expansion.mjs';

async function readDataset(file) {
 return JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
}

export async function loadDataset() {
 const [pilot, india, india100, india150] = await Promise.all([
  readDataset('./pilot.json'),
  readDataset('./india.json'),
  readDataset('./india-100.json'),
  readDataset('./india-150.json')
 ]);
 const batches = [pilot, expansion, india, india100, india150];
 return {
  sources: batches.flatMap(batch => batch.sources.map(source => ({
   ...source,
   accessedOn: batch.researchedOn || india.researchedOn
  }))),
  sites: batches.flatMap(batch => batch.sites),
  buildings: batches.flatMap(batch => batch.buildings)
 };
}
