// Rendering of the library, set, and preview panels.
// ---- rendering ----
const inSet=t=>set.includes(t);
function renderLib(){const q=$('#q').value.toLowerCase(),fs=$('#fs').value,ft=$('#ft').value;
 const r=songs().filter(s=>(!fs||s.s===fs)&&(!ft||s.ty===ft)&&(!q||(s.t+' '+s.w+' '+s.secs.join(' ')).toLowerCase().includes(q)));
 $('#cnt').textContent=r.length+' of '+songs().length+' songs';
 $('#lib').innerHTML=r.map(s=>`<div class="it" data-t="${esc(s.t)}"><div class="nm" data-a="v"><b>${esc(s.t)}</b><small>${esc([s.w,s.k].filter(Boolean).join(' · '))} · ${secsOf(s).length} slides</small></div>${s.added?'<span class="tag">added</span><button data-a="d" title="Delete song">✕</button>':''}<button data-a="t" class="${inSet(s.t)?'on':''}">${inSet(s.t)?'✓ In set':'+ Add'}</button></div>`).join('')||'<p class="mut" style="padding:10px">No songs match.</p>'}
function renderSet(){set=set.filter(find);const n=set.reduce((a,t)=>a+secsOf(find(t)).length,0);
 $('#scnt').textContent=set.length+' songs · '+n+' slides';$('#exp').disabled=!set.length;
 $('#set').innerHTML=set.map((t,i)=>`<div class="it" data-t="${esc(t)}" data-i="${i}"><span class="mut">${i+1}.</span><div class="nm" data-a="v"><b>${esc(t)}</b></div><button data-a="u" ${i?'':'disabled'}>↑</button><button data-a="dn" ${i<set.length-1?'':'disabled'}>↓</button><button data-a="r">✕</button></div>`).join('')||'<p class="mut" style="padding:10px">No songs yet — use “+ Add” in the library.</p>';
 ls.set('lw_set',set)}
function renderPrev(){const s=prev&&find(prev);$('#phint').hidden=!!s;$('#ptitle').textContent=s?'Preview — '+s.t:'Preview';
 $('#prev').innerHTML=s?(pt=>secsOf(s).map(x=>slideHtml(s.t,x,pt)))(uniformPt([...set.flatMap(t=>secsOf(find(t))),...secsOf(s)])).join(''):''}
function renderAll(){renderLib();renderSet();renderPrev()}
