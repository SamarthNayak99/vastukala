import {historicalQuery} from './heritage-filters.mjs';
import React,{useEffect,useMemo,useState} from 'react';
import {Link,useParams,useSearchParams,useNavigate} from 'react-router-dom';
import {api} from './api';
import './empires.css';
const label=value=>value.replaceAll('_',' ');
function useRecords(path){const[state,set]=useState({data:null,error:''}),[revision,refresh]=useState(0);useEffect(()=>{let active=true;set(previous=>({...previous,error:''}));api(path).then(data=>active&&set({data,error:''})).catch(e=>active&&set({data:null,error:e.message}));return()=>{active=false;};},[path,revision]);return {...state,reload:()=>refresh(n=>n+1)};}
export function EmpireRelations({relations=[]}){return <section className="empire-relations"><p className="eyebrow">PEOPLE, PATRONAGE & POWER</p><h2>Historical connections.</h2>{relations.length?relations.map(r=><article key={r.id}><p className="eyebrow">{label(r.relationship)} · {r.kind}</p><h3><Link to={'/empires/'+r.slug}>{r.name} ↗</Link></h3><p>{r.evidence}</p><a className="underlined" href={r.url} target="_blank" rel="noreferrer">{r.source_title} ↗</a><small>{r.locator}</small></article>):<p>No verified dynastic or political association is recorded yet. An architectural style alone does not identify a royal builder.</p>}</section>;}
export default function Empires(){const{slug}=useParams();return slug?<EmpireDetail key={slug} slug={slug}/>:<EmpireDirectory/>;}
function EmpireDirectory(){const{data,error}=useRecords('/empires'),[p,set]=useSearchParams();const q=p.get('q')||'',kind=p.get('kind')||'';const visible=(data||[]).filter(e=>(!kind||e.kind===kind)&&`${e.name} ${e.region} ${e.summary}`.toLowerCase().includes(q.toLowerCase()));const update=(k,v)=>{const n=new URLSearchParams(p);v?n.set(k,v):n.delete(k);set(n);};return <div className="page empire-page"><header className="empire-heading"><p className="eyebrow">THE HISTORIES BEHIND THE STONES</p><h1>Empires & their legacies.</h1><p>Explore dynasties, kingdoms and the patrons who shaped the collection. Follow a documented connection from a historical profile to a monument and its evidence.</p></header><div className="empire-scope"><strong>Read the relationship, not just the name.</strong><p>Construction, patronage and later additions are distinct from historical context. Civilisations, chiefdoms and colonial administrations retain their own labels. Dates below describe monument phases represented here, rather than a dynasty’s entire lifespan.</p></div><div className="empire-filters"><label>Search name or region<input type="search" value={q} onChange={e=>update('q',e.target.value)} placeholder="Chola, Assam, Maratha…"/></label><label>Historical grouping<select value={kind} onChange={e=>update('kind',e.target.value)}><option value="">All groupings</option>{[...new Set((data||[]).map(e=>e.kind))].sort().map(k=><option key={k}>{k}</option>)}</select></label><p role="status">{visible.length} profiles</p></div>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Opening the historical collection…</p>}<div className="empire-grid">{visible.map((e,i)=><Link className="empire-card" to={'/empires/'+e.slug} key={e.id}>{e.cover_key&&<img src={`/media/${e.cover_key}-960.webp`} alt={`Monument associated with ${e.name}`} loading="lazy"/>}<div className="empire-card-copy"><p className="eyebrow">{String(i+1).padStart(2,'0')} / {e.kind}</p><h2>{e.name} ↗</h2><p>{e.region}</p><p>{e.summary}</p><small>{e.monument_count} monuments · {e.date_label}</small></div></Link>)}</div>{data&&!visible.length&&<p>No profiles match. Try a different name or historical grouping.</p>}<EmpireManager/></div>;}
function EmpireDetail({slug}){const{data:e,error,reload}=useRecords('/empires/'+slug),[p,set]=useSearchParams();const state=p.get('state')||'',kind=p.get('relationship')||'';const rows=(e?.monuments||[]).filter(r=>(!state||r.state===state)&&(!kind||r.relationship===kind));const groups=useMemo(()=>{const m=new Map();for(const r of rows){if(!m.has(r.building_id))m.set(r.building_id,{...r,claims:[]});m.get(r.building_id).claims.push(r);}return [...m.values()];},[e,state,kind]);const update=(k,v)=>{const n=new URLSearchParams(p);v?n.set(k,v):n.delete(k);set(n);};if(!e)return <div className="page"><Link to="/empires">← Historical profiles</Link><p role={error?'alert':'status'}>{error||'Opening the profile…'}</p></div>;return <div className="page empire-page"><Link className="back" to="/empires">← All historical profiles</Link><header className="empire-heading"><p className="eyebrow">{e.kind} / {e.region}</p><h1>{e.name}</h1><p className="lead">{e.summary}</p><small>{e.date_label}. This is collection coverage, not a reign or territorial claim.</small></header>{error&&<p role="alert">{error}</p>}<div className="empire-story"><section><h2>Historical context.</h2><p>{e.history}</p></section><section><h2>Reading the architecture.</h2><p>{e.architectural_notes}</p></section></div><div className="empire-scope"><strong>Evidence has a scope.</strong><p>Historical context may record a period, architectural tradition or later political association. It does not establish that every part of a monument was commissioned by this ruler or dynasty. Unknown patrons remain unknown.</p></div><div className="section-heading"><div><p className="eyebrow">CONNECTED THROUGH THE DATABASE</p><h2>Monuments & their evidence.</h2></div><Link className="underlined" to={'/catalogue?'+historicalQuery(e.id,state,kind)}>Open in the catalogue ↗</Link></div><div className="empire-filters"><label>State / UT<select value={state} onChange={x=>update('state',x.target.value)}><option value="">All states</option>{[...new Set(e.monuments.map(r=>r.state))].sort().map(s=><option key={s}>{s}</option>)}</select></label><label>Relationship<select value={kind} onChange={x=>update('relationship',x.target.value)}><option value="">All relationships</option>{[...new Set(e.monuments.map(r=>r.relationship))].sort().map(s=><option value={s} key={s}>{label(s)}</option>)}</select></label><p role="status">{groups.length} monuments · {rows.length} evidence relationships</p><Link className="underlined" to={'/map?'+historicalQuery(e.id,state,kind)}>Explore on the map ↗</Link></div><div className="empire-monuments">{groups.map(b=><article key={b.building_id}>{b.cover_key&&<Link to={'/buildings/'+b.slug}><img loading="lazy" src={`/media/${b.cover_key}-960.webp`} alt={b.name}/></Link>}<div><p className="eyebrow">{b.state}</p><h3><Link to={'/buildings/'+b.slug}>{b.name} ↗</Link></h3><p>{b.date_label}</p>{b.claims.map(r=><div className="empire-claim" key={r.id}><strong>{label(r.relationship)}</strong><p>{r.evidence}</p><a className="underlined" href={r.url} target="_blank" rel="noreferrer">{r.source_title} ↗</a><small>{r.locator}</small></div>)}<Link className="text-button" to={'/buildings/'+b.slug}>Photographs, architectural details & credits ↗</Link></div></article>)}</div>{!groups.length&&<p>No records match these filters.</p>}<section className="empire-sources"><h2>Profile references.</h2>{e.sources.map(s=><div key={s.source_id}><a className="underlined" href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><p>{s.author_or_publisher} · {s.topic} · {s.locator}</p></div>)}</section><Link className="button" to="/dbms-lab?section=lessons&lesson=empires">See how these relationships work in SQL ↗</Link><EmpireManager profile={e} onSaved={reload}/></div>;}
const blank={slug:'',name:'',kind:'dynasty',region:'',date_label:'',summary:'',history:'',architectural_notes:'',year_from:null,year_to:null,sources:[]};
function EmpireManager({profile,onSaved}){const{data:session}=useRecords('/auth/session');return session?.authenticated?<details className="management-tools"><summary>Administrator · manage historical profiles and connections</summary><EmpireForms profile={profile} csrf={session.csrf} onSaved={onSaved}/></details>:null;}
function EmpireForms({profile,csrf,onSaved}){
 const navigate=useNavigate(),{data:tax,error:taxonomyError}=useRecords('/taxonomy'),{data:records,error:recordError}=useRecords('/admin/buildings?limit=200');
 const initialClaim={building_id:'',relationship:'historical_context',evidence:'',source_id:'',locator:'',year_from:null,year_to:null};
 const [form,F]=useState(profile?{...Object.fromEntries(Object.keys(blank).map(k=>[k,profile[k]])),sources:profile.sources.map(s=>({source_id:s.source_id,topic:s.topic,locator:s.locator}))}:blank);
 const [claim,C]=useState(initialClaim),[editing,E]=useState(null),[message,M]=useState(''),[busy,B]=useState(false);
 const put=(k,v)=>F(s=>({...s,[k]:v})),year=v=>v===''?null:Number(v);
 const resetClaim=()=>{E(null);C(initialClaim);};
 const submit=async(event,kind)=>{
  event.preventDefault();if(busy)return;B(true);M('Saving…');
  try{
   if(kind==='profile'){
    await api('/admin/empires'+(profile?'/'+profile.id:''),{method:profile?'PUT':'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify(form)});
    if(!profile||profile.slug!==form.slug)navigate('/empires/'+form.slug);
    else onSaved?.();
   }else{
    await api('/admin/empire-associations'+(editing?'/'+editing:''),{method:editing?'PUT':'POST',headers:{'X-CSRF-Token':csrf},body:JSON.stringify({...claim,building_id:Number(claim.building_id),source_id:Number(claim.source_id),empire_id:profile.id})});
    resetClaim();onSaved?.();
   }
   M('Saved.');
  }catch(error){M(error.message);}finally{B(false);}
 };
 const remove=async id=>{
  if(busy)return;B(true);M('Removing connection…');
  try{await api('/admin/empire-associations/'+id,{method:'DELETE',headers:{'X-CSRF-Token':csrf}});if(editing===id)resetClaim();onSaved?.();M('Connection removed.');}
  catch(error){M(error.message);}finally{B(false);}
 };
 const reference=(source,i)=>put('sources',form.sources.map((r,j)=>j===i?{...r,...source}:r));
 return <div className="empire-admin">
  <p role="status">{message}</p>
  {(taxonomyError||recordError)&&<p role="alert">{taxonomyError||recordError}</p>}
  <form onSubmit={event=>submit(event,'profile')}>
   <fieldset className="empire-admin-fields" disabled={busy}>
    <h3>{profile?'Edit profile':'Create a historical profile'}</h3>
    {['name','slug','region','date_label'].map(k=><label key={k}>{label(k)}<input required value={form[k]} onChange={e=>put(k,e.target.value)}/></label>)}
    <label>Grouping<select value={form.kind} onChange={e=>put('kind',e.target.value)}>{['empire','dynasty','kingdom','sultanate','confederacy','colonial administration','civilisation','chiefdom','patron family'].map(k=><option key={k}>{k}</option>)}</select></label>
    {['summary','history','architectural_notes'].map(k=><label key={k}>{label(k)}<textarea required rows={4} value={form[k]} onChange={e=>put(k,e.target.value)}/></label>)}
    {['year_from','year_to'].map(k=><label key={k}>{label(k)} · blank = unknown<input type="number" value={form[k]??''} min="-4000" max="2100" onChange={e=>put(k,year(e.target.value))}/></label>)}
    <p>Profile references</p>
    {form.sources.map((s,i)=><div className="repeat-item" key={i}>
     <label>Source<select required value={s.source_id} onChange={e=>reference({source_id:Number(e.target.value)},i)}><option value="">Choose reference</option>{tax?.sources.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label>
     <label>Claim supported<input required value={s.topic} onChange={e=>reference({topic:e.target.value},i)}/></label>
     <label>Location within reference<input value={s.locator} onChange={e=>reference({locator:e.target.value},i)}/></label>
     <button type="button" onClick={()=>put('sources',form.sources.filter((_,j)=>j!==i))}>Remove reference</button>
    </div>)}
    <button type="button" onClick={()=>put('sources',[...form.sources,{source_id:'',topic:'History and architecture',locator:''}])}>Add reference</button>
    <button disabled={!form.sources.length||!tax} type="submit">Save profile</button>
   </fieldset>
  </form>
  {profile&&<>
   <form onSubmit={event=>submit(event,'claim')}>
    <fieldset className="empire-admin-fields" disabled={busy}>
     <h3>{editing?'Edit connection':'Add a monument connection'}</h3>
     {editing&&<button type="button" onClick={()=>{resetClaim();M('Ready to add a new connection.');}}>Cancel editing / new connection</button>}
     <label>Monument<select required value={claim.building_id} onChange={e=>C({...claim,building_id:e.target.value})}><option value="">Choose monument</option>{records?.items.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
     <label>Relationship<select value={claim.relationship} onChange={e=>C({...claim,relationship:e.target.value})}>{['construction','patronage','addition','restoration','historical_context'].map(k=><option value={k} key={k}>{label(k)}</option>)}</select></label>
     <label>Evidence and limits<textarea required rows={5} value={claim.evidence} onChange={e=>C({...claim,evidence:e.target.value})}/></label>
     <label>Source<select required value={claim.source_id} onChange={e=>C({...claim,source_id:e.target.value})}><option value="">Choose reference</option>{tax?.sources.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></label>
     <label>Location within source<input value={claim.locator} onChange={e=>C({...claim,locator:e.target.value})}/></label>
     {['year_from','year_to'].map(k=><label key={k}>{label(k)} · blank = unknown<input type="number" min="-4000" max="2100" value={claim[k]??''} onChange={e=>C({...claim,[k]:year(e.target.value)})}/></label>)}
     <button disabled={!tax||!records} type="submit">Save connection</button>
    </fieldset>
   </form>
   <div><h3>Existing public connections</h3>{profile.monuments.map(r=><p key={r.id}>{r.name} · {label(r.relationship)} <button disabled={busy} onClick={()=>{E(r.id);C(Object.fromEntries(Object.keys(initialClaim).map(k=>[k,r[k]])));M('Connection selected for editing.');}}>Edit</button><button disabled={busy} onClick={()=>remove(r.id)}>Remove connection</button></p>)}</div>
  </>}
 </div>;
}
