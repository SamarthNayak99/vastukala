import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import request from 'supertest';
import bcrypt from 'bcryptjs';
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
 const catalogue=await import('../server/catalogue.mjs');saveBuilding=catalogue.saveBuilding;tax=await catalogue.taxonomy();records=(await catalogue.listBuildings({limit:48},{admin:true})).items;
 await pool.query('INSERT INTO admins(email,password_hash) VALUES($1,$2)',['tester@vastukala.local',await bcrypt.hash('test-password-1234',4)]);
 app=await(await import('../server/app.mjs')).createApp();
});
after(async()=>{app?.locals.sessionStore?.close();if(pool)await pool.end();if(control){if(testName)await control.query(`DROP DATABASE ${testName} WITH (FORCE)`);await control.end();}});
test('all 30 sourced records publish across seven locations with prepared photographs',async()=>{
 const res=await request(app).get('/api/buildings?limit=48').expect(200);assert.equal(res.body.total,30);assert.equal(new Set(res.body.items.map(x=>x.site)).size,7);assert.ok(res.body.items.every(x=>x.images.some(i=>i.is_cover)&&x.citations.length&&x.elements.length));
 const counts=Object.fromEntries([...new Set(res.body.items.map(x=>x.site))].map(site=>[site,res.body.items.filter(x=>x.site===site).length]));
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
 const page=await request(app).get('/api/buildings?limit=2&page=2').expect(200);assert.equal(page.body.items.length,2);assert.equal(page.body.total,30);
 await request(app).get('/api/buildings?materials=oops').expect(400);
});
test('comparison validates distinct published buildings and identifies intersections',async()=>{
 const a=records.find(x=>x.slug==='badami-cave-3'),b=records.find(x=>x.slug==='virupaksha-temple-pattadakal');
 const res=await request(app).get(`/api/compare?ids=${a.id},${b.id}`).expect(200);assert.ok(res.body.shared.elements.some(x=>x.name==='Sculptural relief'));
 await request(app).get(`/api/compare?ids=${a.id},${a.id}`).expect(400);
});
test('statistics count buildings rather than joined citation/media rows',async()=>{
 const res=await request(app).get('/api/statistics').expect(200);assert.equal(res.body.buildings,30);assert.equal(res.body.site_count,7);assert.equal(res.body.types.reduce((a,x)=>a+x.count,0),30);
 assert.equal(res.body.elements.find(x=>x.name==='Mandapa').count,15);
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
 assert.equal(body.catalogue.length,30);
 const image=body.building.images.find(x=>x.hotspots.length);assert.equal(image.hotspots.length,2);
 for(const h of image.hotspots){assert.ok(h.element.name);assert.ok(h.evidence.length);assert.ok(h.related.every(x=>x.id!==body.building.id));assert.ok(h.x>=0&&h.x<=100);}
 assert.ok(image.hotspots.find(x=>x.element.name==='Arch').related.length);
 const cave=await request(app).get('/api/explore/anatomy?building=badami-cave-2').expect(200);assert.ok(cave.body.building.images.some(x=>!x.hotspots.length));
 await request(app).get('/api/explore/anatomy?building=not-a-monument').expect(404);
});

test('timeline uses overlapping building-date ranges and keeps undated records separate',async()=>{
 const all=(await request(app).get('/api/explore/time').expect(200)).body;assert.equal(all.dated.length,28);assert.equal(all.undated.length,2);
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
test('map coverage and sourced life events preserve the catalogue',async()=>{const res=await request(app).get('/api/buildings?limit=48').expect(200);assert.equal(res.body.total,30);assert.ok(res.body.items.every(b=>b.map_latitude!==null&&b.map_longitude!==null&&b.map_source_url));const b=res.body.items.find(b=>b.slug==='chennakeshava-temple-belur');const events=await request(app).get(`/api/buildings/${b.slug}/events`).expect(200);assert.ok(events.body.some(e=>e.kind==='restoration'&&e.year_from===2023&&e.url));assert.ok(events.body.every(e=>e.year_from<=e.year_to&&e.source_title));await request(app).get('/api/buildings/no-such-building/events').expect(404);});
test('life events require authentication, CSRF, valid sources and ordered dates',async()=>{const b=records[0];const event={kind:'addition',title:'Temporary test event',year_from:1200,year_to:1210,precision:'range',source_id:tax.sources[0].id,description:'Test only',locator:'test'};await request(app).post(`/api/admin/buildings/${b.id}/events`).send(event).expect(401);const agent=request.agent(app);let s=(await agent.get('/api/auth/session')).body;s=(await agent.post('/api/auth/login').set('X-CSRF-Token',s.csrf).send({email:'tester@vastukala.local',password:'test-password-1234'}).expect(200)).body;const path=`/api/admin/buildings/${b.id}/events`;await agent.post(path).send(event).expect(403);await agent.post(path).set('X-CSRF-Token',s.csrf).send({...event,year_to:1100}).expect(400);await agent.post(path).set('X-CSRF-Token',s.csrf).send({...event,source_id:2147483647}).expect(400);const r=await agent.post(path).set('X-CSRF-Token',s.csrf).send(event).expect(201);await agent.put(`${path}/${r.body.id}`).set('X-CSRF-Token',s.csrf).send({...event,title:'Edited event'}).expect(200);await agent.delete(`/api/admin/buildings/${records[1].id}/events/${r.body.id}`).set('X-CSRF-Token',s.csrf).expect(404);await agent.delete(`${path}/${r.body.id}`).set('X-CSRF-Token',s.csrf).expect(200);});
