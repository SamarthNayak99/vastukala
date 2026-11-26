import React from 'react';
import {historicalRelationships} from './heritage-filters.mjs';

export default function HistoricalRelationshipFilter({value='',onChange}){
 return <label className="search-label">Historical relationship<select value={value} onChange={e=>onChange(e.target.value)}><option value="">All relationships</option>{historicalRelationships.map(kind=><option key={kind} value={kind}>{kind.replaceAll('_',' ')}</option>)}</select></label>;
}
