import React,{useEffect,useState} from 'react';

const preference=window.matchMedia('(prefers-color-scheme: dark)');
const storageKey='vastukala-theme';

function savedTheme(){
 try {
  const value=localStorage.getItem(storageKey);
  return value==='light'||value==='dark'?value:null;
 } catch {
  return null;
 }
}

function applyTheme(theme){
 document.documentElement.dataset.theme=theme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#211d19':'#f5f0e8');
}

const initialTheme=savedTheme();
applyTheme(initialTheme??(preference.matches?'dark':'light'));

export default function ThemeToggle(){
 const [choice,setChoice]=useState(initialTheme);
 const [systemDark,setSystemDark]=useState(preference.matches);
 const theme=choice??(systemDark?'dark':'light');
 useEffect(()=>{
  const update=event=>setSystemDark(event.matches);
  preference.addEventListener('change',update);
  return()=>preference.removeEventListener('change',update);
 },[]);
 useEffect(()=>applyTheme(theme),[theme]);

 function toggle(){
  const next=theme==='dark'?'light':'dark';
  setChoice(next);
  try { localStorage.setItem(storageKey,next); } catch {}
 }

 return <button type="button" className="theme-toggle" aria-label="Dark mode" aria-pressed={theme==='dark'} onClick={toggle}>
  <span aria-hidden="true">{theme==='dark'?'☀':'☾'}</span>
  {theme==='dark'?'Light mode':'Dark mode'}
 </button>;
}
