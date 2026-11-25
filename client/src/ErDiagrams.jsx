import React,{useState} from 'react';
import model from './er-diagrams.json';
import './er-diagrams.css';

const explanations=[
 'Start here to see how the collection fits together. Buildings are the centre: places locate them, classifications describe them, and photographs and sources document them. This overview shows keys only; choose a focused diagram for attributes.',
 'One state can contain many sites, and one site can contain many monuments. Each building references one site and one primary type. Alternate names are separate rows, so searching an alias does not create a duplicate monument.',
 'A monument can use several materials, and one material can occur in many monuments. The same pattern applies to styles and elements. Each junction row records one occurrence; its notes describe that particular building, while the shared definition stays in the category table.',
 'A source is a reusable reference. A citation connects it to a building and can optionally support one particular material, style or element occurrence. Composite foreign keys ensure that the cited occurrence belongs to that same building.',
 'An image belongs to one building. A hotspot connects a position on that image to an element recorded for the same building. Composite keys prevent linking a photograph from one monument to an occurrence from another. Image coordinates are percentages, so labels scale with the photograph.',
 'A building has a construction range, but later events need their own dates. Each event references one building and one source. This lets Life Stories show an addition or restoration separately without changing the original construction date.',
 'These tables support the application rather than describe heritage. Administrators authenticate, sessions store session JSON, migrations track schema changes, and seed tasks track imported data. Session identity is an application-level link inside JSON; no foreign-key connector should be drawn for it.',
 'Constraint and transaction lessons create temporary sites, buildings and links. These are teaching records, separate from the catalogue. The scale experiment uses lab_scale independently; it has no declared primary or foreign key. Temporary tables disappear when their connection closes.'
];

export default function ErDiagrams({onInspect}){
 const [selected,setSelected]=useState(model.pages[0].id),[zoom,setZoom]=useState(100);
 const page=model.pages.find(p=>p.id===selected),index=model.pages.indexOf(page);
 const relations=model.fks.filter(f=>(page.relationships||[]).includes(f.number));
 const choose=id=>{setSelected(id);setZoom(100);};
 return <section className="lab-er" aria-label="ER diagram collection">
  <div className="er-intro"><p className="eyebrow">THE DATABASE, DRAWN OUT</p><h2>See how the records connect.</h2><p>Eight diagrams explain {model.tableCount} permanent tables and {model.fks.length} declared foreign keys, plus the separate temporary practice model.</p></div>
  <div className="er-legend"><span><b>PK</b> Identifies a row</span><span><b>FK</b> References another table</span><span><b>UQ</b> Unique value</span><span><b>?</b> Nullable column</span><span><b>1 / 0..1</b> Required / optional parent</span><span><b>0..*</b> Zero or many children</span></div>
  <div className="er-layout"><nav className="er-menu" aria-label="Choose an ER diagram">{model.pages.map((p,i)=><button key={p.id} aria-pressed={selected===p.id} onClick={()=>choose(p.id)}><span>{String(i+1).padStart(2,'0')}</span>{p.title}</button>)}</nav>
   <article className="er-detail" aria-labelledby="er-title">
    <p className="eyebrow">DIAGRAM {index+1} OF {model.pages.length}{index===7?' · TEMPORARY TABLES':index===6?' · OPERATIONS':' · HERITAGE CATALOGUE'}</p><h3 id="er-title">{page.title}</h3><p>{page.subtitle}</p>
    <div className="er-toolbar" role="group" aria-label="Diagram viewing controls"><button disabled={zoom<=100} onClick={()=>setZoom(z=>Math.max(100,z-50))} aria-label="Zoom out">−</button><output aria-live="polite">{zoom}%</output><button disabled={zoom>=300} onClick={()=>setZoom(z=>Math.min(300,z+50))} aria-label="Zoom in">+</button><button onClick={()=>setZoom(100)}>Fit diagram</button><a className="underlined" href={`/er-diagrams/${page.id}.svg`} target="_blank" rel="noreferrer">Open full-size ↗</a></div>
    <div className="er-canvas" tabIndex={0} role="region" aria-label={`${page.title}: scroll to explore at higher zoom`}><img style={{width:`${zoom}%`}} src={`/er-diagrams/${page.id}.svg`} alt={`${page.title}. ${page.subtitle} Relationships are described in text below.`}/></div>
    <section className="er-explanation"><h4>What this means</h4><p>{explanations[index]}</p><ul>{page.notes.map(n=><li key={n}>{n}</li>)}</ul></section>
    {!!page.names?.length&&<div className="lab-table-picker" aria-label="Tables in this diagram">{page.names.map(name=>['admins','sessions','schema_migrations','seed_tasks'].includes(name)?<span className="er-private-table" key={name}>{name} · structure only</span>:<button key={name} onClick={()=>onInspect(name)}>Inspect {name} ↗</button>)}</div>}
    {relations.length>0&&<section className="er-register"><h4>Read each relationship</h4><p>Each R-number matches a connector. A parent may have zero or many child rows. The child references one parent, unless its foreign key is nullable.</p>{relations.map(f=><div className="er-relation" key={f.number}><strong>{f.number}</strong><div><p><code>{f.referenced_table} ({f.referenced_columns.join(', ')})</code> → <code>{f.table_name} ({f.columns.join(', ')})</code></p><details><summary>Exact PostgreSQL constraint</summary><pre><code>{f.definition}</code></pre></details></div></div>)}</section>}
    {index===7&&<p className="lab-insight">lab_sites → lab_buildings uses site_id; lab_buildings → lab_links uses building_id. Both practice foreign keys are nullable, so a child may have no parent. lab_scale has no relationship to these tables.</p>}
   </article>
  </div>
  <p className="lab-fine">Schema reference: migrations 001–007. These are structural diagrams, with no administrator or session records. Use Schema explorer for live public column definitions and sample rows. Arrows run from parent to child in these diagrams; the Schema explorer uses child-to-parent arrows.</p>
 </section>;
}
