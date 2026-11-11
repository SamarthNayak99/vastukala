import {z} from 'zod';
import {pool} from './db.mjs';
import {getBuilding} from './catalogue.mjs';

const spatial=new Set(['Garden','Stepped tank','Stepped descent','Causeway','Sacred pool','Monastic cells','Colonnade','Mandapa','Courtyard','Circumambulatory passage','Circumambulatory platform','Apsidal plan','Twin-shrine plan','Triple-shrine plan']);
export function evidenceFor(building,kind,categoryId){
 return building.citations.filter(c=>c.target_kind===kind&&c.taxonomy_id===categoryId);
}
const attribute=(b,kind,x)=>({...x,evidence:evidenceFor(b,kind,x.id)});
export async function compareBuildings(rawIds){
 const values=String(rawIds||'').split(',');
 if(values.length!==2||new Set(values).size!==2||values.some(x=>!/^\d{1,9}$/.test(x)))throw Object.assign(new Error('Select two different buildings.'),{status:400});
 const buildings=await Promise.all(values.map(x=>getBuilding(Number(x),{byId:true})));
 if(buildings.some(x=>!x))throw Object.assign(new Error('Building not found.'),{status:404});
 const relations=[['materials','building_materials','material_id'],['styles','building_styles','style_id'],['elements','building_elements','element_id']];
 const sharedSql=relations.map(([kind,table,column])=>`(SELECT '${kind}'::text AS kind,${column} AS id FROM ${table} WHERE building_id=$1 INTERSECT SELECT '${kind}'::text,${column} FROM ${table} WHERE building_id=$2)`).join(' UNION ALL ');
 const differenceSql=relations.flatMap(([kind,table,column])=>[0,1].map(side=>`(SELECT '${kind}'::text AS kind,${side}::int AS side,${column} AS id FROM ${table} WHERE building_id=$${side+1} EXCEPT SELECT '${kind}'::text,${side}::int,${column} FROM ${table} WHERE building_id=$${2-side})`)).join(' UNION ALL ');
 const [intersection,exclusive]=await Promise.all([pool.query(sharedSql,values.map(Number)),pool.query(differenceSql,values.map(Number))]);
 const shared={},differences={};
 for(const [key,kind]of [['materials','material'],['styles','style'],['elements','element']]){
  shared[key]=buildings[0][key].filter(x=>intersection.rows.some(row=>row.kind===key&&row.id===x.id));
  differences[key]=buildings.map((b,i)=>b[key].filter(x=>exclusive.rows.some(row=>row.kind===key&&row.side===i&&row.id===x.id)).map(x=>attribute(b,kind,x)));
 }
 const groups=[['materials','material','Shared materials',()=>true],['layouts','element','Shared spatial features',x=>spatial.has(x.name)],['elements','element','Shared architectural details',x=>!spatial.has(x.name)],['styles','style','Shared architectural traditions',()=>true]].map(([key,kind,title,predicate])=>{
  const rows=shared[key==='layouts'?'elements':key].filter(predicate);
  return {key,title,items:rows.map(x=>({id:x.id,name:x.name,sides:buildings.map(b=>attribute(b,kind,b[kind==='element'?'elements':key].find(y=>y.id===x.id)))}))};
 });
 const dated=buildings.every(b=>b.year_from!==null&&b.year_to!==null);
 const overlap=dated?Math.max(buildings[0].year_from,buildings[1].year_from)<=Math.min(buildings[0].year_to,buildings[1].year_to):null;
 const materialCount=shared.materials.length,elementCount=shared.elements.length;
 const summary=materialCount||elementCount?`These records share ${materialCount} documented material${materialCount===1?'':'s'} and ${elementCount} architectural feature${elementCount===1?'':'s'}. The cited similarities offer a way to read their resemblance; they do not establish direct influence.`:'No shared materials or architectural features are documented for this pair yet. Compare the individual evidence before drawing a visual conclusion.';
 return {buildings,shared,differences,groups,summary,chronology:{overlap,note:!dated?'At least one record has no assigned date range.':overlap?'Their recorded building-date ranges overlap. This does not date each architectural feature.':'Their recorded building-date ranges do not overlap. Similar features alone do not prove influence.'},caution:'Documented only in one record does not mean absent from the other. Shared spatial features do not establish identical floor plans.'};
}

export async function anatomy(slug){
 const catalogue=(await pool.query(`SELECT b.id,b.slug,b.name,s.name AS site,count(DISTINCT h.storage_key)::int AS annotated_images,count(h.id)::int AS hotspots
 FROM buildings b JOIN sites s ON s.id=b.site_id JOIN hotspots h ON h.building_id=b.id
 JOIN images i ON i.building_id=h.building_id AND i.storage_key=h.storage_key AND i.approved
 WHERE b.status='published' GROUP BY b.id,s.id ORDER BY b.name,s.name`)).rows;
 const selected=slug||catalogue[0]?.slug;
 if(!selected)return {catalogue,building:null};
 const b=await getBuilding(selected);if(!b)throw Object.assign(new Error('Building not found.'),{status:404});
 const related=(await pool.query(`SELECT be.element_id,b.id,b.name,b.slug,s.name AS site,
 (SELECT storage_key FROM images i WHERE i.building_id=b.id AND i.approved ORDER BY is_cover DESC,sort_order,id LIMIT 1) AS storage_key
 FROM building_elements be JOIN buildings b ON b.id=be.building_id JOIN sites s ON s.id=b.site_id
 WHERE b.status='published' AND b.id<>$1 AND be.element_id=ANY($2::int[]) ORDER BY b.name,s.name`,[b.id,b.elements.map(x=>x.id)])).rows;
 b.images=b.images.map(im=>({...im,hotspots:im.hotspots.map(h=>({...h,element:b.elements.find(x=>x.id===h.element_id),evidence:evidenceFor(b,'element',h.element_id),related:related.filter(x=>x.element_id===h.element_id)}))}));
 return {catalogue,building:b};
}

export async function acrossTime(query){
 const schema=z.object({element:z.coerce.number().int().positive().optional(),from:z.coerce.number().int().min(-4000).max(2100).refine(x=>x!==0,'There is no year zero').default(-3000),to:z.coerce.number().int().min(-4000).max(2100).refine(x=>x!==0,'There is no year zero').default(2000)}).refine(x=>x.from<=x.to,'Start year must not exceed end year.');
 const filters=schema.parse(query);
 const rows=(await pool.query(`SELECT b.id FROM buildings b WHERE b.status='published'
 AND ($1::int IS NULL OR EXISTS(SELECT 1 FROM building_elements be WHERE be.building_id=b.id AND be.element_id=$1))
 AND ((b.year_from IS NULL OR b.year_to IS NULL) OR (b.year_from<=$3 AND b.year_to>=$2))
 ORDER BY b.year_from ASC NULLS LAST,b.name,b.id`,[filters.element||null,filters.from,filters.to])).rows;
 const items=await Promise.all(rows.map(x=>getBuilding(x.id,{byId:true})));
 const element=filters.element?(await pool.query('SELECT * FROM elements WHERE id=$1',[filters.element])).rows[0]:null;
 if(filters.element&&!element)throw Object.assign(new Error('Architectural element not found.'),{status:404});
 const records=items.map(b=>({...b,date_evidence:b.citations.filter(c=>!c.target_kind),feature_evidence:filters.element?evidenceFor(b,'element',filters.element):[]}));
 const dated=records.filter(b=>b.year_from!==null&&b.year_to!==null),undated=records.filter(b=>b.year_from===null||b.year_to===null);
 const centuries=[];for(let from=Math.floor(filters.from/100)*100;from<=filters.to;from+=100){const to=from+99;centuries.push({from:from===0?1:from,to,count:dated.filter(b=>b.year_from<=to&&b.year_to>=from).length});}
 return {filters,element,dated,undated,centuries,note:'Bars show recorded building-date ranges, including broad phases and approximate dates. They do not establish when an individual feature first appeared or prove influence. A building can overlap several century bands.'};
}
