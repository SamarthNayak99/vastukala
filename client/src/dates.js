export const formatYear=y=>y<0?`${Math.abs(y)} BCE`:y>0?`${y} CE`:'BCE / CE';
export const formatRange=(a,b)=>a===b?formatYear(a):`${formatYear(a)} – ${formatYear(b)}`;
