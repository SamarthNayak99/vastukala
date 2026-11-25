import React,{useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {api} from './api';
import './chat.css';

const suggestions=[['Read a structure','How does a corbelled arch differ from a true arch?'],['Explore a monument','Explain the layout and materials of the Taj Mahal.'],['Compare traditions','What is the difference between Nagara and Dravidian temple architecture?'],['Look closer','What is a mandapa, and how is it used in temples?']];
function AnswerText({text,sources}){
 const inline=line=>line.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part,i)=>{
  const id=Number(part.match(/^\[(\d+)\]$/)?.[1]);
  return id&&sources.some(s=>s.id===id)?<a key={i} className="chat-citation" href={sources.find(s=>s.id===id).url} target="_blank" rel="noreferrer" aria-label={`Reference ${id}`}>{part}</a>:part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part;
 });
 return <div className="chat-answer-text">{text.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=>{
  const lines=paragraph.split('\n');return lines.every(l=>/^\s*[-*•]\s/.test(l))?<ul key={i}>{lines.map((line,j)=><li key={j}>{inline(line.replace(/^\s*[-*•]\s/,''))}</li>)}</ul>:<p key={i}>{lines.map((line,j)=><React.Fragment key={j}>{j>0&&<br/>}{inline(line.replace(/^#{1,4}\s/,''))}</React.Fragment>)}</p>;
 })}</div>;
}

export default function ArchitectureChat(){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[available,setAvailable]=useState(null),[statusError,setStatusError]=useState(false);
 const controller=useRef(null),tail=useRef(null),input=useRef(null);
 useEffect(()=>{let alive=true;api('/chat/status').then(s=>{if(alive)setAvailable(s.available);}).catch(()=>{if(alive)setStatusError(true);});return()=>{alive=false;controller.current?.abort();};},[]);
 useEffect(()=>{if(messages.length)tail.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});},[messages,busy]);
 const send=async(question=draft)=>{
  const text=question.trim();if(!text||text.length>1500||busy||available===false)return;
  const history=messages.slice(-6).map(m=>({role:m.role,content:m.content.slice(0,1000)}));
  const turn={role:'user',content:text};setMessages(old=>[...old,turn]);setDraft('');setError('');setBusy(true);
  const request=new AbortController();controller.current=request;
  try{const answer=await api('/chat',{method:'POST',signal:request.signal,body:JSON.stringify({message:text,history})});setMessages(old=>[...old,{role:'assistant',content:answer.answer,...answer}]);}
  catch(e){setMessages(old=>old.slice(0,-1));setDraft(text);setError(e.name==='AbortError'?'Response stopped. Your question is ready to send again.':e.message);}
  finally{controller.current=null;setBusy(false);input.current?.focus();}
 };
 const clear=()=>{if(busy)return;setMessages([]);setError('');setDraft('');input.current?.focus();};
 return <div className="page architecture-chat">
  <header className="chat-heading"><div><p className="eyebrow">ASK · UNDERSTAND · EXPLORE</p><h1>A conversation<br/>with architecture.</h1><p>Meet your guide to India’s built heritage. Ask about a monument, a material, or the ideas holding it all together.</p></div><span className="chat-provider"><span aria-hidden="true">✦</span> Powered by Groq</span></header>
  <div className="chat-layout"><aside className="chat-aside"><p className="eyebrow">A PLACE TO BEGIN</p><h2>Follow your curiosity.</h2><div className="chat-suggestions">{suggestions.map(([title,question])=><button key={title} disabled={busy||available===false} onClick={()=>send(question)}><small>{title}</small><span>{question}</span><span aria-hidden="true">↗</span></button>)}</div><div className="chat-scope"><h3>Answers with context.</h3><p>The guide looks for relevant public catalogue records and links supporting references when available. Broader architectural explanations use AI knowledge.</p><p>AI can make mistakes. Check the linked records for research and academic work.</p><Link className="underlined" to="/catalogue">Explore the collection ↗</Link></div></aside>
   <section className="chat-workspace" aria-label="Architecture conversation"><div className="chat-topbar"><span><span className="chat-status-dot" aria-hidden="true"/>{available===false?'Not connected':'Architecture guide'}</span><button onClick={clear} disabled={busy||!messages.length}>New conversation</button></div>
    <div className="chat-messages" role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions">
     {!messages.length&&<div className="chat-welcome"><span className="chat-mark" aria-hidden="true">✦</span><h2>Every detail has a story.</h2><p>Why does a dome stand? What makes Hoysala carvings distinctive? Start with a question, then explore the evidence.</p><div className="chat-topic-tags"><span>Structures</span><span>Materials</span><span>Regional styles</span><span>Monuments</span></div></div>}
     {messages.map((m,i)=><article className={`chat-message ${m.role}`} key={i}><p className="chat-speaker">{m.role==='user'?'You':'Vastukala guide'}{m.role==='assistant'&&<span>{({catalogue:'Catalogue references',general:'General explanation',mixed:'Catalogue + general explanation'})[m.basis]}</span>}</p>{m.role==='user'?<p className="chat-user-text">{m.content}</p>:<><AnswerText text={m.content} sources={m.sources||[]}/>{m.sources?.length>0&&<details className="chat-sources"><summary>Supporting catalogue references ({m.sources.length})</summary><ol>{m.sources.map(s=><li key={s.id} value={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><small>{s.publisher} · {s.building}</small>{s.claim&&<p>{s.claim}</p>}</li>)}</ol></details>}{m.buildings?.length>0&&<div className="chat-related"><small>Related catalogue records</small>{m.buildings.map(b=><Link key={b.slug} to={`/buildings/${b.slug}`}>{b.name} ↗</Link>)}</div>}</>}</article>)}
     {busy&&<p className="chat-thinking" role="status">Reading the catalogue and preparing your answer<span aria-hidden="true">…</span></p>}<div ref={tail}/>
    </div>
    <div className="chat-compose">{available===false&&<p role="status" className="chat-error">The guide is awaiting its server connection. You can still explore the collection.</p>}{statusError&&<p className="chat-fine">Could not check availability. You can still try sending a question.</p>}{error&&<p role="alert" className="chat-error">{error}</p>}<form onSubmit={e=>{e.preventDefault();send();}}><label className="chat-input-label" htmlFor="architecture-question">Your architecture question</label><textarea id="architecture-question" ref={input} rows={3} maxLength={1500} value={draft} disabled={busy||available===false} placeholder="Ask about Indian architecture…" onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send();}}}/><div className="chat-compose-actions"><small>{draft.length}/1500 · Shift + Enter for a new line</small>{busy?<button type="button" onClick={()=>controller.current?.abort()}>Stop response</button>:<button className="button" type="submit" disabled={!draft.trim()||available===false}>Ask the guide ↗</button>}</div></form><p className="chat-fine">Questions and recent messages are sent to Groq. Conversations stay in this page’s memory and clear on refresh. Free-tier limits apply. No live web search.</p></div>
   </section>
  </div>
 </div>;
}
