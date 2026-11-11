import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import request from 'supertest';
import bcrypt from 'bcryptjs';

test('DBMS Lab exposes actual public schema and bounded samples, excluding infrastructure',async()=>{
 const schema=(await request(app).get('/api/lab/schema').expect(200)).body;
 assert.equal(schema.tables.length,16);assert.ok(!schema.tables.some(t=>['admins','sessions','schema_migrations','seed_tasks'].includes(t.name)));
 const hotspots=schema.tables.find(t=>t.name==='hotspots');assert.ok(hotspots.constraints.some(c=>c.kind==='f'&&c.referenced_table==='images'));
 for(const table of schema.tables){const r=(await request(app).get(`/api/lab/tables/${table.name}`).expect(200)).body;assert.ok(r.rows.length<=8);assert.ok(r.sql.includes('LIMIT 8'));}
 await request(app).get('/api/lab/tables/admins').expect(400);await request(app).get('/api/lab/tables/sessions').expect(400);
});
test('DBMS guided queries execute joins, division, set operations, aggregates and plans',async()=>{
 const taj=records.find(b=>b.slug==='taj-mahal-agra'),humayun=records.find(b=>b.slug==='humayuns-tomb-delhi');
 const run=async(template,params={})=>(await request(app).post('/api/lab/query').send({template,params}).expect(200)).body;
 const relation=await run('relationships',{building:taj.id});assert.equal(relation.relatedTables.length,3);assert.ok(relation.rows.some(r=>r.material==='Marble'));
 const left=await run('joins',{join:'left'}),inner=await run('joins',{join:'inner'});assert.ok(left.rows.some(r=>r.monument===null));assert.ok(inner.rows.every(r=>r.monument!==null));
 assert.ok((await run('division',{elements:['Dome','Garden']})).rows.some(r=>r.name==='Taj Mahal'));
 assert.ok((await run('sets',{building:taj.id,other:humayun.id,operation:'shared'})).rows.some(r=>r.element==='Dome'));
 const counts=await run('aggregation',{distinct:true}),trap=await run('aggregation',{distinct:false});assert.equal(counts.rows.reduce((a,r)=>a+r.monuments,0),100);assert.ok(trap.rows.reduce((a,r)=>a+r.joined_rows,0)>100);
 assert.equal((await run('state',{state:'Rajasthan'})).rows.length,9);
 assert.ok((await run('filters',{state:'Uttar Pradesh',material:'Marble',element:'Dome'})).rows.some(r=>r.name==='Taj Mahal'));
 assert.ok((await run('temporal',{from:-500,to:-1})).rows.some(r=>r.name==='Great Stupa at Sanchi'));
 assert.equal((await run('views')).rows.length,100);assert.equal((await run('ranking')).rows.length,100);
 assert.ok((await run('indexes',{building:tax.sites[0].id})).plan[0].Plan);
});
test('DBMS Lab rejects arbitrary SQL and hides unpublished records from samples and templates',async()=>{
 const draft=(await pool.query("INSERT INTO buildings(site_id,type_id,name,slug,status) VALUES($1,$2,'Hidden lab draft','hidden-lab-draft','draft') RETURNING id",[tax.sites[0].id,tax.building_types[0].id])).rows[0];
 try{
  const sample=(await request(app).get('/api/lab/tables/buildings').expect(200)).body;assert.ok(sample.rows.every(r=>r.status==='published'));
  const result=(await request(app).post('/api/lab/query').send({template:'relationships',params:{building:draft.id}}).expect(200)).body;assert.equal(result.rows.length,0);assert.ok(result.relatedTables.every(t=>!t.rows.length));
  await request(app).post('/api/lab/query').send({template:'views',sql:'SELECT * FROM admins'}).expect(400);
  await request(app).post('/api/lab/query').send({template:'SELECT * FROM admins'}).expect(400);
  await request(app).post('/api/lab/query').send({template:'views',params:{sql:'DELETE FROM buildings'}}).expect(400);
  const injection=(await request(app).post('/api/lab/query').send({template:'state',params:{state:"' OR 1=1 --"}}).expect(200)).body;assert.equal(injection.rows.length,0);
  await request(app).post('/api/lab/query').send({template:'temporal',params:{from:1500,to:1000}}).expect(400);
  await request(app).post('/api/lab/query').send({template:'division',params:{elements:[]}}).expect(400);
 }finally{await pool.query('DELETE FROM buildings WHERE id=$1',[draft.id]);}
});
test('DBMS practice exercises isolate real constraints and commit/rollback from the catalogue',async()=>{
 const snapshot=async()=>JSON.stringify((await pool.query('SELECT id,name,status FROM buildings ORDER BY id')).rows);const before=await snapshot();
 const expected={duplicate:'23505',foreign:'23503',dates:'23514','transaction-failure':'23505'};
 for(const [scenario,code] of Object.entries(expected)){const r=(await request(app).post('/api/lab/practice').send({scenario}).expect(200)).body;assert.equal(r.error.code,code);assert.equal(r.committed,false);assert.deepEqual(r.before,r.after);}
 const success=(await request(app).post('/api/lab/practice').send({scenario:'transaction-success'}).expect(200)).body;assert.equal(success.committed,true);assert.equal(success.error,null);assert.equal(success.after.links.length,2);assert.equal(success.after.buildings[0].name,'Edited practice monument');
 const again=(await request(app).post('/api/lab/practice').send({scenario:'duplicate'}).expect(200)).body;assert.equal(again.before.buildings[0].name,'Practice monument');assert.equal(again.before.links.length,1);
 await request(app).post('/api/lab/practice').send({scenario:'DELETE FROM buildings'}).expect(400);
 assert.equal(await snapshot(),before);assert.equal((await pool.query("SELECT to_regclass('public.lab_buildings') AS relation")).rows[0].relation,null);
});
test('DBMS index experiment returns measured plans from synthetic temporary data only',async()=>{
 const before=(await pool.query('SELECT count(*) FROM buildings')).rows[0].count;
 const r=(await request(app).post('/api/lab/performance').send({}).expect(200)).body;assert.ok(r.before[0].Plan);assert.ok(r.after[0].Plan);assert.ok(r.setup.includes('40000'));assert.ok(JSON.stringify(r.after).includes('lab_scale_site_idx'));
 assert.equal((await pool.query('SELECT count(*) FROM buildings')).rows[0].count,before);assert.equal((await pool.query("SELECT to_regclass('public.lab_scale') AS relation")).rows[0].relation,null);
 await request(app).post('/api/lab/performance').send({sql:'SELECT * FROM admins'}).expect(400);
});
let pool,app,saveBuilding,tax,records,control,testName;
before(async()=>{
 const config=JSON.parse(await readFile('.local/runtime.json','utf8'));
 const base=new URL(process.env.TEST_DATABASE_BASE_URL||config.databaseUrl);base.pathname='/postgres';
 control=new pg.Client({connectionString:base.toString()});await control.connect();
 testName=`vastukala_test_${Date.now()}`;
 await control.query(`CREATE DATABASE ${testName}`);
 base.pathname=`/${testName}`;process.env.DATABASE_URL=base.toString();process.env.SESSION_SECRET='integration-test-secret-with-more-than-thirty-two-characters';
 ({pool}=await import('../server/db.mjs'));
 const {migrate}=await import('../scripts/migrate.mjs');await migrate();
 const {seed}=await import('../scripts/seed.mjs');await seed();
 const catalogue=await import('../server/catalogue.mjs');saveBuilding=catalogue.saveBuilding;tax=await catalogue.taxonomy();records=(await catalogue.listBuildings({limit:120},{admin:true})).items;
 await pool.query('INSERT INTO admins(email,password_hash) VALUES($1,$2)',['tester@vastukala.local',await bcrypt.hash('test-password-1234',4)]);
 app=await(await import('../server/app.mjs')).createApp();
});
after(async()=>{app?.locals.sessionStore?.close();if(pool)await pool.end();if(control){if(testName)await control.query(`DROP DATABASE ${testName} WITH (FORCE)`);await control.end();}});
test('original Karnataka records remain across seven locations with prepared photographs',async()=>{
 const res=await request(app).get('/api/buildings?limit=120&states=Karnataka').expect(200);assert.equal(res.body.total,32);const originals=res.body.items.filter(b=>!['mysore-palace','gol-gumbaz-vijayapura'].includes(b.slug));assert.equal(new Set(originals.map(x=>x.site)).size,7);assert.ok(originals.every(x=>x.images.some(i=>i.is_cover)&&x.citations.length&&x.elements.length));
 const counts=Object.fromEntries([...new Set(originals.map(x=>x.site))].map(site=>[site,originals.filter(x=>x.site===site).length]));
 assert.deepEqual(counts,{Aihole:6,Badami:6,Belur:1,Halebidu:1,Hampi:8,Pattadakal:7,Somanathapura:1});
});
test('combined location, type, material and all-elements filters return the known match',async()=>{
 const b=records.find(x=>x.slug==='badami-cave-3');
 const query={sites:b.site_id,types:b.type_id,materials:b.materials.map(x=>x.id).join(','),elements:b.elements.map(x=>x.id).join(',')};
 const res=await request(app).get('/api/buildings').query(query).expect(200);assert.deepEqual(res.body.items.map(x=>x.id),[b.id]);
 const missing=tax.materials.find(x=>!b.materials.some(y=>y.id===x.id));
 const negative=await request(app).get('/api/buildings').query({...query,materials:[...b.materials.map(x=>x.id),missing.id].join(',')}).expect(200);assert.equal(negative.body.total,0);
});
test('alternate names, literal SQL-like input, pagination and invalid IDs',async()=>{
 const alias=await request(app).get('/api/buildings').query({q:'Lokeshwara'}).expect(200);assert.ok(alias.body.items.some(x=>x.slug==='virupaksha-temple-pattadakal'));
 const injection=await request(app).get('/api/buildings').query({q:"' OR 1=1 --"}).expect(200);assert.equal(injection.body.total,0);
 const page=await request(app).get('/api/buildings?limit=2&page=2').expect(200);assert.equal(page.body.items.length,2);assert.equal(page.body.total,100);
 await request(app).get('/api/buildings?materials=oops').expect(400);
});
test('comparison validates distinct published buildings and identifies intersections',async()=>{
 const a=records.find(x=>x.slug==='badami-cave-3'),b=records.find(x=>x.slug==='virupaksha-temple-pattadakal');
 const res=await request(app).get(`/api/compare?ids=${a.id},${b.id}`).expect(200);assert.ok(res.body.shared.elements.some(x=>x.name==='Sculptural relief'));
 await request(app).get(`/api/compare?ids=${a.id},${a.id}`).expect(400);
});
test('statistics count buildings rather than joined citation/media rows',async()=>{
 const res=await request(app).get('/api/statistics').expect(200);assert.equal(res.body.buildings,100);assert.equal(res.body.site_count,73);assert.equal(res.body.types.reduce((a,x)=>a+x.count,0),100);
 assert.equal(res.body.elements.find(x=>x.name==='Mandapa').count,records.filter(b=>b.elements.some(e=>e.name==='Mandapa')).length);
});
test('foreign keys and date constraints reject bad data',async()=>{
 await assert.rejects(pool.query('INSERT INTO building_materials(building_id,material_id) VALUES($1,$2)',[records[0].id,999999]),e=>e.code==='23503');
 await assert.rejects(pool.query('UPDATE buildings SET year_from=2000,year_to=1000 WHERE id=$1',[records[0].id]),e=>e.code==='23514');
});
test('failed relationship update rolls back the building and all its associations',async()=>{
 const original=records.find(x=>x.slug==='badami-cave-3');const invalid={...original,name:'Should roll back',materials:[...original.materials,{id:999999,notes:''}]};
 await assert.rejects(saveBuilding(invalid,original.id),e=>e.code==='23503');
 const result=(await pool.query('SELECT name FROM buildings WHERE id=$1',[original.id])).rows[0];assert.equal(result.name,original.name);
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM building_elements WHERE building_id=$1',[original.id])).rows[0].n,original.elements.length);
});
test('administrator login, CSRF, transactional editing, drafts and logout',async()=>{
 await request(app).post('/api/admin/buildings').send({}).expect(401);
 const agent=request.agent(app);let session=(await agent.get('/api/auth/session').expect(200)).body;
 await agent.post('/api/auth/login').send({email:'tester@vastukala.local',password:'test-password-1234'}).expect(403);
 session=(await agent.post('/api/auth/login').set('X-CSRF-Token',session.csrf).send({email:'tester@vastukala.local',password:'test-password-1234'}).expect(200)).body;
 const copy={...records[0],name:'Test draft',slug:'test-draft',status:'draft'};
 const created=(await agent.post('/api/admin/buildings').set('X-CSRF-Token',session.csrf).send(copy).expect(201)).body;
 await request(app).get('/api/buildings/test-draft').expect(404);
 copy.name='Updated draft';await agent.put(`/api/admin/buildings/${created.id}`).set('X-CSRF-Token',session.csrf).send(copy).expect(200);
 const updated=(await agent.get(`/api/admin/buildings/${created.id}`).expect(200)).body;assert.equal(updated.name,'Updated draft');
 const invalid={...copy,status:'published',images:[]};await agent.put(`/api/admin/buildings/${created.id}`).set('X-CSRF-Token',session.csrf).send(invalid).expect(400);
 await agent.put(`/api/admin/buildings/${created.id}`).set('X-CSRF-Token',session.csrf).send({...copy,status:'published'}).expect(200);
 await request(app).get('/api/buildings/test-draft').expect(200);
 await agent.put(`/api/admin/buildings/${created.id}`).set('X-CSRF-Token',session.csrf).send({...copy,status:'archived'}).expect(200);
 await request(app).get('/api/buildings/test-draft').expect(404);
 const visible=await request(app).get('/api/buildings?q=Updated%20draft').expect(200);assert.equal(visible.body.total,0);
 await request(app).get(`/api/compare?ids=${created.id},${records[1].id}`).expect(404);
 await agent.post('/api/auth/logout').set('X-CSRF-Token',session.csrf).send({}).expect(200);await agent.get('/api/admin/buildings').expect(401);
});
test('composite foreign key rejects an image targeting another building element',async()=>{
 const a=records.find(x=>x.slug==='badami-cave-3'),b=records.find(x=>x.slug==='durga-temple-aihole');
 const element=(await pool.query('SELECT id FROM building_elements WHERE building_id=$1 LIMIT 1',[b.id])).rows[0].id;
 await assert.rejects(pool.query('UPDATE images SET building_element_id=$1 WHERE building_id=$2',[element,a.id]),e=>e.code==='23503');
});
test('same-named monuments remain distinct by location and slug',async()=>{
 const res=await request(app).get('/api/buildings?q=Virupaksha&limit=48').expect(200);
 const temples=res.body.items.filter(x=>x.name==='Virupaksha Temple');
 assert.deepEqual(temples.map(x=>x.site).sort(),['Hampi','Pattadakal']);
 assert.equal(new Set(temples.map(x=>x.slug)).size,2);
 const comparison=await request(app).get(`/api/compare?ids=${temples.map(x=>x.id).join(',')}`).expect(200);
 assert.equal(comparison.body.buildings.length,2);
});

test('new monument associations support combined filters and cross-site comparison',async()=>{
 const sample=records.find(x=>x.slug==='mallikarjuna-temple-pattadakal');
 const res=await request(app).get('/api/buildings').query({sites:sample.site_id,types:sample.type_id,materials:tax.materials.find(x=>x.name==='Sandstone').id,elements:tax.elements.find(x=>x.name==='Mandapa').id}).expect(200);
 assert.deepEqual(res.body.items.map(x=>x.slug).sort(),['jambulinga-temple-pattadakal','kadasiddheshvara-temple-pattadakal','mallikarjuna-temple-pattadakal','papanatha-temple-pattadakal']);
 const pair=['hoysaleswara-temple-halebidu','keshava-temple-somanathapura'].map(slug=>records.find(x=>x.slug===slug).id);
 const comparison=await request(app).get(`/api/compare?ids=${pair.join(',')}`).expect(200);
 assert.ok(comparison.body.shared.materials.some(x=>x.name==='Chloritic schist'));
 assert.ok(comparison.body.shared.elements.some(x=>x.name==='Sculptural frieze'));
});

test('database rejects duplicate relationships, multiple covers and cross-building citations',async()=>{
 const a=records.find(x=>x.slug==='badami-cave-3'),b=records.find(x=>x.slug==='durga-temple-aihole');
 await assert.rejects(pool.query('INSERT INTO building_materials(building_id,material_id) VALUES($1,$2)',[a.id,a.materials[0].id]),e=>e.code==='23505');
 await assert.rejects(pool.query('UPDATE images SET is_cover=true WHERE building_id=$1',[a.id]),e=>e.code==='23505');
 const target=(await pool.query('SELECT id FROM building_elements WHERE building_id=$1 LIMIT 1',[b.id])).rows[0].id;
 await assert.rejects(pool.query('INSERT INTO citations(building_id,source_id,claim_topic,building_element_id) VALUES($1,$2,$3,$4)',[a.id,a.citations[0].source_id,'Invalid cross-building claim',target]),e=>e.code==='23503');
 assert.equal((await pool.query('SELECT count(*)::int AS n FROM images WHERE building_id=$1 AND is_cover',[a.id])).rows[0].n,1);
});

test('comparison explains shared spatial features and differences with per-building evidence',async()=>{
 const pair=['hoysaleswara-temple-halebidu','keshava-temple-somanathapura'].map(slug=>records.find(b=>b.slug===slug).id);
 const{body}=await request(app).get(`/api/compare?ids=${pair.join(',')}`).expect(200);
 assert.ok(body.groups.find(g=>g.key==='layouts').items.some(x=>x.name==='Circumambulatory platform'));
 assert.ok(body.groups.every(g=>g.items.every(x=>x.sides.every(s=>s.evidence.length))));
 assert.ok(body.differences.elements[0].some(x=>x.name==='Twin-shrine plan'));
 assert.ok(body.differences.elements[1].some(x=>x.name==='Triple-shrine plan'));
 assert.match(body.caution,/does not mean absent/);assert.equal(body.chronology.overlap,false);
});

test('anatomy joins visible photographs, cited elements and other published monuments',async()=>{
 const{body}=await request(app).get('/api/explore/anatomy?building=elephant-stables-hampi').expect(200);
 assert.equal(body.catalogue.length,100);
 const image=body.building.images.find(x=>x.hotspots.length);assert.equal(image.hotspots.length,2);
 for(const h of image.hotspots){assert.ok(h.element.name);assert.ok(h.evidence.length);assert.ok(h.related.every(x=>x.id!==body.building.id));assert.ok(h.x>=0&&h.x<=100);}
 assert.ok(image.hotspots.find(x=>x.element.name==='Arch').related.length);
 const cave=await request(app).get('/api/explore/anatomy?building=badami-cave-2').expect(200);assert.ok(cave.body.building.images.some(x=>!x.hotspots.length));
 await request(app).get('/api/explore/anatomy?building=not-a-monument').expect(404);
});

test('timeline uses overlapping building-date ranges and keeps undated records separate',async()=>{
 const all=(await request(app).get('/api/explore/time').expect(200)).body;assert.equal(all.dated.length,98);assert.equal(all.undated.length,2);
 assert.ok(all.undated.every(x=>x.year_from===null||x.year_to===null));assert.match(all.note,/do not establish/);
 const feature=tax.elements.find(x=>x.name==='Sculptural frieze');
 const window=(await request(app).get('/api/explore/time').query({element:feature.id,from:1200,to:1300}).expect(200)).body;
 assert.deepEqual(window.dated.map(x=>x.slug),['keshava-temple-somanathapura']);assert.ok(window.dated[0].feature_evidence.length);assert.ok(window.dated[0].date_evidence.length);
 await request(app).get('/api/explore/time?from=1500&to=1000').expect(400);
 await request(app).get('/api/explore/time?element=oops').expect(400);
 await request(app).get('/api/explore/time?element=999999').expect(404);
});

test('hotspot edits require valid coordinates, building elements and specific evidence',async()=>{
 const original=records.find(x=>x.slug==='badami-cave-2');
 const invalid=structuredClone(original);invalid.images.find(x=>x.hotspots.length).hotspots[0].x=101;
 await assert.rejects(saveBuilding(invalid,original.id),/100/);
 const wrong=structuredClone(original);wrong.images.find(x=>x.hotspots.length).hotspots[0].element_id=tax.elements.find(x=>x.name==='Inscription').id;
 await assert.rejects(saveBuilding(wrong,original.id),/Hotspot element/);
 const uncited=structuredClone(original);uncited.citations=uncited.citations.filter(c=>c.target_kind!=='element');
 await assert.rejects(saveBuilding(uncited,original.id),/citation/);
});

test('ordinary saves preserve hotspots, explicit removal persists across reseeding',async()=>{
 const {getBuilding}=await import('../server/catalogue.mjs');const original=await getBuilding('badami-cave-2',{admin:true});
 const previous=original.images.flatMap(x=>x.hotspots);assert.equal(previous.length,1);
 const legacy={...original,images:original.images.map(({hotspots,...im})=>im)};
 await saveBuilding(legacy,original.id);
 const saved=await getBuilding(original.slug,{admin:true});assert.deepEqual(saved.images.flatMap(x=>x.hotspots),previous);
 await saveBuilding({...saved,images:saved.images.map(im=>({...im,hotspots:[]}))},original.id);
 await(await import('../scripts/seed.mjs')).seed();
 assert.equal((await getBuilding(original.slug,{admin:true})).images.flatMap(x=>x.hotspots).length,0);
 await saveBuilding(original,original.id);
});

test('hotspot foreign keys and public visibility hold for unapproved photos and archived buildings',async()=>{
 const a=records.find(x=>x.slug==='badami-cave-2'),b=records.find(x=>x.slug==='queens-bath-hampi');
 await assert.rejects(pool.query('INSERT INTO hotspots(building_id,storage_key,element_id,label,x,y) VALUES($1,$2,$3,$4,50,50)',[a.id,b.images[0].storage_key,a.elements[0].id,'Wrong image']),e=>e.code==='23503');
 await pool.query("UPDATE images SET approved=false WHERE building_id=$1 AND storage_key='badami-cave-2-relief'",[a.id]);
 let res=(await request(app).get('/api/explore/anatomy?building=badami-cave-2').expect(200)).body;
 assert.equal(res.building.images.flatMap(x=>x.hotspots).length,0);assert.ok(!res.catalogue.some(x=>x.id===a.id));
 await pool.query('UPDATE images SET approved=true WHERE building_id=$1',[a.id]);
 await pool.query("UPDATE buildings SET status='archived' WHERE id=$1",[a.id]);
 await request(app).get('/api/explore/anatomy?building=badami-cave-2').expect(404);
 res=(await request(app).get('/api/explore/time').expect(200)).body;assert.ok(!res.dated.some(x=>x.id===a.id));
 await pool.query("UPDATE buildings SET status='published' WHERE id=$1",[a.id]);
});

test('SQL calendar dates survive JSON backup round trips without timezone shifts',async()=>{
 const source=(await pool.query('SELECT id,accessed_on FROM sources ORDER BY id LIMIT 1')).rows[0];
 assert.match(source.accessed_on,/^\d{4}-\d{2}-\d{2}$/);
 const json=JSON.parse(JSON.stringify(source));
 const restored=(await pool.query('SELECT $1::date AS accessed_on',[json.accessed_on])).rows[0];
 assert.equal(restored.accessed_on,source.accessed_on);
});
test('map coverage and sourced life events preserve the catalogue',async()=>{const res=await request(app).get('/api/buildings?limit=120').expect(200);assert.equal(res.body.total,100);assert.ok(res.body.items.every(b=>b.map_latitude!==null&&b.map_longitude!==null&&b.map_source_url));const b=res.body.items.find(b=>b.slug==='chennakeshava-temple-belur');const events=await request(app).get(`/api/buildings/${b.slug}/events`).expect(200);assert.ok(events.body.some(e=>e.kind==='restoration'&&e.year_from===2023&&e.url));assert.ok(events.body.every(e=>e.year_from<=e.year_to&&e.source_title));await request(app).get('/api/buildings/no-such-building/events').expect(404);});
test('life events require authentication, CSRF, valid sources and ordered dates',async()=>{const b=records[0];const event={kind:'addition',title:'Temporary test event',year_from:1200,year_to:1210,precision:'range',source_id:tax.sources[0].id,description:'Test only',locator:'test'};await request(app).post(`/api/admin/buildings/${b.id}/events`).send(event).expect(401);const agent=request.agent(app);let s=(await agent.get('/api/auth/session')).body;s=(await agent.post('/api/auth/login').set('X-CSRF-Token',s.csrf).send({email:'tester@vastukala.local',password:'test-password-1234'}).expect(200)).body;const path=`/api/admin/buildings/${b.id}/events`;await agent.post(path).send(event).expect(403);await agent.post(path).set('X-CSRF-Token',s.csrf).send({...event,year_to:1100}).expect(400);await agent.post(path).set('X-CSRF-Token',s.csrf).send({...event,source_id:2147483647}).expect(400);const r=await agent.post(path).set('X-CSRF-Token',s.csrf).send(event).expect(201);await agent.put(`${path}/${r.body.id}`).set('X-CSRF-Token',s.csrf).send({...event,title:'Edited event'}).expect(200);await agent.delete(`/api/admin/buildings/${records[1].id}/events/${r.body.id}`).set('X-CSRF-Token',s.csrf).expect(404);await agent.delete(`${path}/${r.body.id}`).set('X-CSRF-Token',s.csrf).expect(200);});

test('India expansion publishes 100 monuments in 21 states/UTs with reusable images',async()=>{
 const res=await request(app).get('/api/buildings?limit=120').expect(200);assert.equal(res.body.total,100);assert.equal(res.body.items.length,100);assert.equal(new Set(res.body.items.map(b=>b.slug)).size,100);assert.equal(new Set(res.body.items.map(b=>b.state)).size,21);
 const india=JSON.parse(await readFile('research/india.json','utf8'));const slugs=new Set(india.buildings.map(b=>b.slug));const added=res.body.items.filter(b=>slugs.has(b.slug));assert.equal(added.length,30);assert.ok(added.every(b=>b.images.length>=1&&b.images.some(i=>i.is_cover&&i.approved)&&b.citations.length>=3));
 assert.ok(added.every(b=>b.images.every(i=>i.author&&i.licence_url&&i.source_page_url&&i.width>=1500)));
 const states=(await request(app).get('/api/taxonomy').expect(200)).body.states;assert.equal(states.length,36);assert.equal(states.reduce((sum,s)=>sum+s.count,0),100);assert.equal(states.find(s=>s.name==='Delhi').kind,'union territory');assert.equal(states.find(s=>s.name==='Karnataka').count,32);
});
test('state filters combine with location, type and aliases across the expanded catalogue',async()=>{
 const k=await request(app).get('/api/buildings?states=Karnataka&limit=120').expect(200);assert.equal(k.body.total,32);assert.ok(k.body.items.every(b=>b.state==='Karnataka'));
 const up=await request(app).get('/api/buildings').query({states:'Uttar Pradesh',q:'Taj Mahal'}).expect(200);assert.equal(up.body.total,1);assert.equal(up.body.items[0].slug,'taj-mahal-agra');
 const two=await request(app).get('/api/buildings').query({states:'Delhi,Tamil Nadu',limit:120}).expect(200);assert.equal(two.body.total,14);assert.ok(two.body.items.every(b=>['Delhi','Tamil Nadu'].includes(b.state)));
 assert.equal((await request(app).get('/api/buildings?states=Karnataka&q=Taj').expect(200)).body.total,0);
 assert.equal((await request(app).get('/api/buildings?states=Punjab&q=Golden').expect(200)).body.items[0].slug,'harmandir-sahib-amritsar');
 await request(app).get('/api/buildings').query({states:"Delhi' OR 1=1"}).expect(400);
 await assert.rejects(pool.query("INSERT INTO sites(name,slug,locality,district,state) VALUES('Invalid state test','invalid-state-test','Test','Test','Atlantis')"),e=>e.code==='23503');
});
test('the 40 added records have mapped locations, open photographs, cited hotspots and sourced events',async()=>{
 const {buildings}=JSON.parse(await readFile('research/india-100.json','utf8'));
 assert.equal(buildings.length,40);
 for(const {slug} of buildings){
  const record=records.find(b=>b.slug===slug);
  assert.ok(record?.map_latitude&&record?.map_longitude&&record?.map_source_url,slug);
  assert.ok(record.images.some(i=>i.is_cover&&i.approved&&i.width>=1500&&i.author&&i.licence_url),slug);
  const anatomy=(await request(app).get('/api/explore/anatomy').query({building:slug}).expect(200)).body;
  assert.ok(anatomy.building.images.some(i=>i.hotspots.some(h=>h.evidence.length)),slug);
  const events=(await request(app).get(`/api/buildings/${slug}/events`).expect(200)).body;
  assert.ok(events.length>0&&events.every(e=>e.url&&e.source_title),slug);
 }
 const gol=records.find(b=>b.slug==='gol-gumbaz-vijayapura');
 const qutb=records.find(b=>b.slug==='qutb-shahi-tombs');
 const comparison=(await request(app).get('/api/compare').query({ids:`${gol.id},${qutb.id}`}).expect(200)).body;
 assert.ok(comparison.shared.elements.some(e=>e.name==='Dome'));
 const harappan=(await request(app).get('/api/explore/time?from=-3000&to=-1500').expect(200)).body;
 assert.ok(harappan.dated.some(b=>b.slug==='dholavira-harappan-city'));
});
test('new monuments participate in cited comparison, anatomy, events and BCE chronology',async()=>{
 const taj=records.find(b=>b.slug==='taj-mahal-agra'),humayun=records.find(b=>b.slug==='humayuns-tomb-delhi');
 const c=(await request(app).get(`/api/compare?ids=${taj.id},${humayun.id}`).expect(200)).body;assert.ok(c.shared.elements.some(e=>e.name==='Dome'));assert.ok(c.groups.some(g=>g.items.some(e=>e.sides.every(side=>side.evidence.length))));
 const anatomy=(await request(app).get('/api/explore/anatomy?building=taj-mahal-agra').expect(200)).body;const newSlugs=new Set(JSON.parse(await readFile('research/india.json','utf8')).buildings.map(b=>b.slug));assert.equal(anatomy.catalogue.filter(b=>newSlugs.has(b.slug)).length,30);assert.ok(anatomy.building.images.some(im=>im.hotspots.some(h=>h.evidence.length&&h.element.name)));
 for(const b of JSON.parse(await readFile('research/india.json','utf8')).buildings){const ev=(await request(app).get(`/api/buildings/${b.slug}/events`).expect(200)).body;assert.ok(ev.length>0,`No sourced event: ${b.slug}`);assert.ok(ev.every(e=>e.url&&e.source_title));}
 const ancient=(await request(app).get('/api/explore/time?from=-500&to=-1').expect(200)).body;assert.ok(ancient.dated.some(b=>b.slug==='great-stupa-sanchi'));assert.equal(ancient.dated.some(b=>b.slug==='taj-mahal-agra'),false);
 await request(app).get('/api/explore/time?from=0&to=100').expect(400);
 await assert.rejects(pool.query('UPDATE buildings SET year_from=0 WHERE id=$1',[taj.id]),e=>e.code==='23514');
});
