import {z} from 'zod';
import pg from 'pg';
import {pool,databaseUrl} from './db.mjs';

// Only server-owned templates execute. Neither SQL text nor identifiers come from visitors.
const integer=z.coerce.number().int().positive().max(2147483647);
const params=z.object({building:integer.optional(),other:integer.optional(),state:z.string().max(100).default('Karnataka'),material:z.string().max(100).default('Sandstone'),element:z.string().max(100).default('Carved pillar'),elements:z.array(z.string().min(1).max(100)).max(6).default(['Mandapa','Courtyard']),join:z.enum(['inner','left']).default('left'),operation:z.enum(['shared','first-only','second-only']).default('shared'),distinct:z.boolean().default(true),from:z.coerce.number().int().min(-4000).max(2100).refine(x=>x!==0).default(1200),to:z.coerce.number().int().min(-4000).max(2100).refine(x=>x!==0).default(1300)}).strict();
const definitions={
 empires:['Historical profiles; dates describe collection coverage','id,name,slug,kind,region,year_from,year_to,date_label'],
 empire_sources:['References supporting a historical profile','empire_id,source_id,topic,locator'],
 building_empires:['A cited relationship between one monument and one historical grouping','id,building_id,empire_id,relationship,evidence,source_id,year_from,year_to'],
 states:['State / union territory dimension','name,kind'],sites:['A heritage location belongs to one state','id,name,state,district'],buildings:['One monument, one site and one primary type','id,name,slug,site_id,type_id,year_from,year_to,status'],building_types:['Shared building-type definitions','id,name,description'],building_aliases:['Alternative names of a monument','id,building_id,alias'],materials:['Shared material definitions','id,name,description'],elements:['Shared architectural element definitions','id,name,description'],styles:['Shared architectural tradition definitions','id,name,description'],building_materials:['Many-to-many material occurrences and local usage','id,building_id,material_id,usage_notes'],building_elements:['Many-to-many element occurrences and local descriptions','id,building_id,element_id,description'],building_styles:['Many-to-many style associations','id,building_id,style_id,notes'],sources:['Bibliographic references supporting published records','id,title,author_or_publisher,url'],citations:['A source supports a claim about a particular monument','id,building_id,source_id,claim_topic,building_material_id,building_element_id,building_style_id'],images:['Approved public photograph metadata','id,building_id,storage_key,caption,author,licence_code,is_cover'],hotspots:['A position on the same monument’s photograph and element occurrence','id,building_id,storage_key,element_id,label,x,y'],building_events:['Separately dated, sourced events','id,building_id,source_id,kind,title,year_from,year_to']
};
export const labTables=Object.keys(definitions);
async function readOnly(fn){const c=await pool.connect();try{await c.query('BEGIN READ ONLY');await c.query("SET LOCAL statement_timeout='3000ms'");const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export async function labSchema(){return readOnly(async c=>{
 const columns=(await c.query("SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name,ordinal_position",[labTables])).rows;
 const constraints=(await c.query("SELECT cl.relname AS table_name,co.conname AS name,co.contype AS kind,pg_get_constraintdef(co.oid) AS definition,ref.relname AS referenced_table FROM pg_constraint co JOIN pg_class cl ON cl.oid=co.conrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace LEFT JOIN pg_class ref ON ref.oid=co.confrelid WHERE ns.nspname='public' AND cl.relname=ANY($1::text[]) ORDER BY cl.relname,co.conname",[labTables])).rows;
 const indexes=(await c.query("SELECT tablename AS table_name,indexname AS name,indexdef AS definition FROM pg_indexes WHERE schemaname='public' AND tablename=ANY($1::text[]) ORDER BY tablename,indexname",[labTables])).rows;
 return {tables:labTables.map(name=>({name,description:definitions[name][0],columns:columns.filter(x=>x.table_name===name),constraints:constraints.filter(x=>x.table_name===name),indexes:indexes.filter(x=>x.table_name===name)})),policy:'Samples contain published architecture records only. Authentication and runtime tables are excluded.'};
});}
export async function labSample(name){if(!labTables.includes(name))throw Object.assign(new Error('Choose a public content table.'),{status:400});
 let where;
 if(name==='states'||name==='empires')where='TRUE';
 else if(name==='empire_sources')where="EXISTS(SELECT 1 FROM building_empires r JOIN public_buildings b ON b.id=r.building_id WHERE r.empire_id=t.empire_id)";
 else if(name==='buildings')where="t.status='published'";
 else if(name==='sites')where='EXISTS(SELECT 1 FROM public_buildings b WHERE b.site_id=t.id)';
 else if(name==='building_types')where='EXISTS(SELECT 1 FROM public_buildings b WHERE b.type_id=t.id)';
 else if(['materials','elements','styles'].includes(name)){const singular={materials:'material',elements:'element',styles:'style'}[name];where=`EXISTS(SELECT 1 FROM building_${name} r JOIN public_buildings b ON b.id=r.building_id WHERE r.${singular}_id=t.id)`;}
 else if(name==='sources')where='EXISTS(SELECT 1 FROM citations r JOIN public_buildings b ON b.id=r.building_id WHERE r.source_id=t.id)';
 else where=`EXISTS(SELECT 1 FROM public_buildings b WHERE b.id=t.building_id)${name==='images'?' AND t.approved':name==='hotspots'?' AND EXISTS(SELECT 1 FROM images i WHERE i.building_id=t.building_id AND i.storage_key=t.storage_key AND i.approved)':''}`;
 const sql=`WITH public_buildings AS (SELECT id,site_id,type_id FROM buildings WHERE status='published')\nSELECT ${definitions[name][1].split(',').map(x=>`t.${x}`).join(', ')}\nFROM ${name} t\nWHERE ${where}\nORDER BY t.${name==='states'?'name':name==='empire_sources'?'empire_id':'id'} LIMIT 8;`;
 return readOnly(async c=>({table:name,sql,rows:(await c.query(sql)).rows}));
}
function template(id,p){
 const b=p.building,other=p.other;
 const publicPair=' AND building_id IN (SELECT id FROM buildings WHERE status=\'published\')';
 const templates={
  empires:()=>({sql:"SELECT e.name AS historical_profile,e.kind,b.name AS monument,s.state,be.relationship,be.evidence,src.title AS source,src.url\nFROM empires e JOIN building_empires be ON be.empire_id=e.id\nJOIN buildings b ON b.id=be.building_id JOIN sites s ON s.id=b.site_id\nJOIN sources src ON src.id=be.source_id\nWHERE b.status='published' AND s.state=$1\nORDER BY e.name,b.name,be.relationship LIMIT 200;",values:[p.state],explanation:'One row is one sourced historical relationship, not one monument. A monument can connect to multiple polities or phases. Historical context does not prove royal construction.'}),
  state:()=>({sql:"SELECT b.name,s.name AS site,s.state\nFROM buildings b JOIN sites s ON s.id=b.site_id\nWHERE b.status='published' AND s.state=$1 ORDER BY b.name LIMIT 200;",values:[p.state],explanation:'A parameterized state filter over published monument records.'}),
  relationships:()=>({sql:"SELECT b.id AS building_id,b.name AS monument,bm.id AS occurrence_id,bm.material_id,m.name AS material,bm.usage_notes\nFROM buildings b\nJOIN building_materials bm ON bm.building_id=b.id\nJOIN materials m ON m.id=bm.material_id\nWHERE b.status='published' AND b.id=$1 ORDER BY m.name LIMIT 200;",values:[b],explanation:'Each result row is a building–material occurrence. The junction table stores usage for that pair, rather than repeating the material definition.'}),
  joins:()=>({sql:`SELECT st.name AS state,b.name AS monument\nFROM states st\n${p.join==='inner'?'INNER':'LEFT'} JOIN sites s ON s.state=st.name\n${p.join==='inner'?'INNER':'LEFT'} JOIN buildings b ON b.site_id=s.id AND b.status='published'\nORDER BY st.name,b.name LIMIT 200;`,values:[],explanation:p.join==='left'?'LEFT JOIN preserves every state/UT, even when monument columns are NULL. Publication filtering stays in ON so unmatched rows survive.':'INNER JOIN retains only states/sites with a matching published monument.'}),
  filters:()=>({sql:"SELECT b.name,s.name AS site,s.state\nFROM buildings b JOIN sites s ON s.id=b.site_id\nWHERE b.status='published' AND s.state=$1\nAND EXISTS(SELECT 1 FROM building_materials bm JOIN materials m ON m.id=bm.material_id WHERE bm.building_id=b.id AND m.name=$2)\nAND EXISTS(SELECT 1 FROM building_elements be JOIN elements e ON e.id=be.element_id WHERE be.building_id=b.id AND e.name=$3)\nORDER BY b.name LIMIT 200;",values:[p.state,p.material,p.element],explanation:'The state AND material AND element must all match. Parameters stay separate from SQL text; user input is never executable SQL.'}),
  division:()=>({sql:"WITH required(name) AS (SELECT unnest($1::text[]))\nSELECT b.name FROM buildings b\nWHERE b.status='published' AND NOT EXISTS(\n SELECT 1 FROM required r WHERE NOT EXISTS(\n  SELECT 1 FROM building_elements be JOIN elements e ON e.id=be.element_id\n  WHERE be.building_id=b.id AND e.name=r.name))\nORDER BY b.name LIMIT 200;",values:[p.elements],explanation:'There must be no requested element missing from the monument. This double NOT EXISTS expresses relational division: match ALL, rather than ANY.'}),
  sets:()=>{const ids=p.operation==='second-only'?[other,b]:[b,other];return {sql:`SELECT e.name AS element FROM elements e JOIN (\n SELECT element_id FROM building_elements WHERE building_id=$1${publicPair}\n ${p.operation==='shared'?'INTERSECT':'EXCEPT'}\n SELECT element_id FROM building_elements WHERE building_id=$2${publicPair}\n) matched ON matched.element_id=e.id ORDER BY e.name LIMIT 200;`,values:ids,explanation:'These are sets of documented associations. A missing record does not establish that an architectural feature is physically absent.'};},
  aggregation:()=>({sql:`SELECT s.state,COUNT(${p.distinct?'DISTINCT b.id':'*'})::int AS ${p.distinct?'monuments':'joined_rows'}\nFROM buildings b JOIN sites s ON s.id=b.site_id\nLEFT JOIN images i ON i.building_id=b.id AND i.approved\nLEFT JOIN citations c ON c.building_id=b.id\nWHERE b.status='published'\nGROUP BY s.state ORDER BY s.state LIMIT 200;`,values:[],explanation:p.distinct?'COUNT(DISTINCT b.id) counts each monument once despite image × citation row multiplication.':'COUNT(*) counts joined rows, not monuments. Multiple photographs and citations multiply rows: this is the deliberate counting trap.'}),
  temporal:()=>({sql:"SELECT name,year_from,year_to,date_label\nFROM buildings WHERE status='published'\nAND year_from<=$2 AND year_to>=$1\nORDER BY year_from,name LIMIT 200;",values:[p.from,p.to],explanation:'Inclusive interval overlap: a phase begins before the selected interval ends, and ends after it begins. Negative years are BCE; NULL dates do not match.'}),
  views:()=>({sql:'SELECT id,name,site,building_type,date_label\nFROM published_building_summary ORDER BY name LIMIT 200;',values:[],explanation:'This is the actual view created by migration 001. A regular view stores a query definition, not a separate cached copy of its rows.'}),
  ranking:()=>({sql:"WITH documented AS (\n SELECT b.name,s.state,COUNT(be.id)::int AS element_count\n FROM buildings b JOIN sites s ON s.id=b.site_id\n LEFT JOIN building_elements be ON be.building_id=b.id\n WHERE b.status='published' GROUP BY b.id,s.state\n)\nSELECT *,DENSE_RANK() OVER(PARTITION BY state ORDER BY element_count DESC) AS state_rank\nFROM documented ORDER BY state,state_rank,name LIMIT 200;",values:[],explanation:'A CTE names the intermediate result. DENSE_RANK ranks documented element counts within each state without collapsing individual monument rows.'}),
  indexes:()=>({sql:"SELECT id,name FROM buildings\nWHERE status='published' AND site_id=$1 ORDER BY id LIMIT 200;",values:[b],explanation:'The site parameter is a SITE ID, not a monument ID. PostgreSQL may choose a sequential scan for this small collection. Execution plans explain the choice.'})
 };
 if(!templates[id])throw Object.assign(new Error('Unknown lesson query.'),{status:400});
 if(['relationships','sets','indexes'].includes(id)&&!b)throw Object.assign(new Error('Choose a record first.'),{status:400});
 if(id==='sets'&&(!other||b===other))throw Object.assign(new Error('Choose two different monuments.'),{status:400});
 if(id==='temporal'&&p.from>p.to)throw Object.assign(new Error('Start year must precede end year.'),{status:400});
 if(id==='division'&&!p.elements.length)throw Object.assign(new Error('Choose at least one element.'),{status:400});
 return templates[id]();
}
export async function labQuery(body){const input=z.object({template:z.string().max(30),params:params.prefault({})}).strict().parse(body);const q=template(input.template,input.params);
 return readOnly(async c=>{
  const start=performance.now();const result=await c.query(q.sql,q.values);const response={template:input.template,label:input.template==='views'?'Used in Vastukala':'Simplified explanation · live public data',...q,rows:result.rows,columns:result.fields.map(x=>x.name),rowCount:result.rowCount,elapsedMs:Math.round((performance.now()-start)*100)/100};
  if(input.template==='indexes')response.plan=(await c.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${q.sql}`,q.values)).rows[0]['QUERY PLAN'];
  if(input.template==='relationships'){
   response.relatedTables=[];
   for(const [name,sql]of [['buildings',"SELECT id,name FROM buildings WHERE id=$1 AND status='published'"],['building_materials',"SELECT bm.building_id,bm.material_id,bm.usage_notes FROM building_materials bm JOIN buildings b ON b.id=bm.building_id WHERE b.id=$1 AND b.status='published' ORDER BY bm.material_id"],['materials',"SELECT m.id,m.name FROM materials m WHERE EXISTS(SELECT 1 FROM building_materials bm JOIN buildings b ON b.id=bm.building_id WHERE bm.material_id=m.id AND b.id=$1 AND b.status='published') ORDER BY m.id"]])response.relatedTables.push({name,rows:(await c.query(sql,[input.params.building])).rows});
  }
  return response;
 });
}

const practiceStatements={
 duplicate:{sql:'INSERT INTO lab_links(building_id,material) VALUES (1,\'Sandstone\');',why:'UNIQUE(building_id,material) prevents the same association twice.'},
 foreign:{sql:'INSERT INTO lab_buildings(id,site_id,name,year_from,year_to) VALUES (2,999,\'Practice monument\',1000,1100);',why:'The site foreign key requires a parent row.'},
 dates:{sql:'UPDATE lab_buildings SET year_from=1400,year_to=1100 WHERE id=1;',why:'CHECK(year_from<=year_to) rejects a reversed interval.'},
 'transaction-success':{sql:"UPDATE lab_buildings SET name='Edited practice monument' WHERE id=1;\nINSERT INTO lab_links(building_id,material) VALUES (1,'Granite');",why:'Both writes commit together in temporary practice tables.'},
 'transaction-failure':{sql:"UPDATE lab_buildings SET name='This edit must roll back' WHERE id=1;\nINSERT INTO lab_links(building_id,material) VALUES (1,'Sandstone');",why:'The second write fails; ROLLBACK also undoes the first name change.'}
};
// TEMP tables must stay on one physical session across COMMIT / ROLLBACK.
// Hosted transaction poolers require an explicitly configured direct URL here.
function practiceClient(){return new pg.Client({connectionString:process.env.LAB_DATABASE_URL||databaseUrl,connectionTimeoutMillis:10000});}
export async function labPractice(body){const {scenario}=z.object({scenario:z.enum(Object.keys(practiceStatements))}).strict().parse(body);const c=practiceClient();
 try{
  await c.connect();
  await c.query("SET statement_timeout='5000ms'");
  const setup="CREATE TEMP TABLE lab_sites(id int PRIMARY KEY,name text NOT NULL);\nCREATE TEMP TABLE lab_buildings(\n id int PRIMARY KEY,site_id int REFERENCES lab_sites(id),\n name text NOT NULL,year_from int,year_to int,\n CHECK(year_from<=year_to));\nCREATE TEMP TABLE lab_links(\n building_id int REFERENCES lab_buildings(id),material text NOT NULL,\n UNIQUE(building_id,material));\nINSERT INTO lab_sites VALUES(1,'Fictional practice site');\nINSERT INTO lab_buildings VALUES(1,1,'Practice monument',1000,1100);\nINSERT INTO lab_links VALUES(1,'Sandstone');";
  await c.query(setup);
  const snapshot=async()=>({buildings:(await c.query('SELECT * FROM lab_buildings ORDER BY id')).rows,links:(await c.query('SELECT * FROM lab_links ORDER BY building_id,material')).rows});
  const before=await snapshot(),task=practiceStatements[scenario],trace=[];let error=null,committed=false,currentStatement='';
  // These statements are fixed literals above, not a parser for user-submitted SQL.
  await c.query('BEGIN');try{for(const statement of task.sql.split(';').map(x=>x.trim()).filter(Boolean)){currentStatement=statement;const r=await c.query(statement);const interim=await snapshot();trace.push({statement,status:`${r.command} ${r.rowCount}`,monument_name:interim.buildings[0].name,material_links:interim.links.length});}await c.query('COMMIT');committed=true;}catch(e){trace.push({statement:currentStatement,status:`Rejected · ${e.code}`,monument_name:'Transaction aborted; inspect state after ROLLBACK',material_links:null});await c.query('ROLLBACK');error={code:e.code,message:e.message,constraint:e.constraint};}
  return {label:'Practice exercise · real PostgreSQL temporary tables',scenario,setup,trace,sql:`BEGIN;\n${task.sql}\n${committed?'COMMIT;':'-- PostgreSQL rejected a statement.\nROLLBACK;'}`,explanation:task.why,before,after:await snapshot(),error,committed,isolation:'Every run creates fresh, connection-local temporary tables. They are destroyed when this connection closes; catalogue tables are never written.'};
 }finally{await c.end();}
}
export async function labPerformance(){const c=practiceClient();try{
 await c.connect();
 await c.query("SET statement_timeout='8000ms'");
 const setup="CREATE TEMP TABLE lab_scale AS SELECT n AS id,(n%4000)::int AS site_id,'Synthetic monument '||n AS name FROM generate_series(1,40000) AS g(n);\nANALYZE lab_scale;";
 await c.query(setup);const sql='SELECT id,name FROM lab_scale WHERE site_id=7;';
 const explain=async()=>(await c.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`)).rows[0]['QUERY PLAN'];
 const before=await explain();const indexSql='CREATE INDEX lab_scale_site_idx ON lab_scale(site_id);\nANALYZE lab_scale;';await c.query(indexSql);const after=await explain();
 return {label:'Practice exercise · 40,000 synthetic rows',setup,sql,indexSql,before,after,explanation:'These measurements come from this request, not a promised speedup. Compare scan nodes and buffers as well as execution time. Cache state and machine load affect timings. This disposable table is unrelated to the researched monuments.'};
 }finally{await c.end();}}
