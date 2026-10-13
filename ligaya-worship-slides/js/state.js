// App state (loaded database, added songs, current set) and lookups.
let base=ls.get('lw_base',null)||SEED, added=ls.get('lw_added',[]), set=ls.get('lw_set',[]), prev=null, theme='dark', fmt=true;
const songs=()=>[...base,...added].sort((a,b)=>a.t.localeCompare(b.t));
const find=t=>songs().find(s=>s.t===t);
