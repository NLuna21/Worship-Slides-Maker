// Rendering of the library, set, and preview panels.
// ---- rendering ----
const inSet=t=>set.includes(t);
function renderLib(){const q=$('#q').value.toLowerCase(),fs=$('#fs').value,ft=$('#ft').value;
 const r=songs().filter(s=>(!fs||s.s===fs)&&(!ft||s.ty===ft)&&(!q||(s.t+' '+s.w+' '+s.secs.join(' ')).toLowerCase().includes(q)));
 $('#cnt').textContent=r.length+' of '+songs().length+' songs';
 $('#lib').innerHTML=r.map(s=>`<div class="it" data-t="${esc(s.t)}"><div class="nm" data-a="v"><b>${esc(s.t)}</b><small>${esc([s.w,s.k].filter(Boolean).join(' · '))} · ${secsOf(s).length} slides</small></div>${s.added?'<span class="tag">added</span><button data-a="d" title="Delete song">✕</button>':''}<button data-a="t" class="${inSet(s.t)?'on':''}">${inSet(s.t)?'✓ In set':'+ Add'}</button></div>`).join('')||'<p class="mut" style="padding:10px">No songs match.</p>'}
function renderSet(){set=set.filter(find);const n=set.reduce((a,t)=>a+secsOf(find(t)).length,0);
 $('#scnt').textContent=$('#bcnt').textContent=set.length+' song'+(set.length===1?'':'s')+' · '+n+' slides';$('#exp').disabled=!set.length;
 $('#set').innerHTML=set.map((t,i)=>`<div class="it" data-t="${esc(t)}" data-i="${i}"><span class="mut">${i+1}.</span><div class="nm" data-a="v"><b>${esc(t)}</b></div><button data-a="u" ${i?'':'disabled'}>↑</button><button data-a="dn" ${i<set.length-1?'':'disabled'}>↓</button><button data-a="r">✕</button></div>`).join('')||'<p class="mut" style="padding:10px">No songs yet — use “+ Add” in the library.</p>';
 ls.set('lw_set',set)}
// Slides for [{s,x}] as HTML. `size` = every section that shares one font size (the export uses the whole set).
// With an imported template, each slide is the real filled-in template slide; otherwise the built-in design.
function deckHtml(items,size){if(tpl&&tctx){try{const opt=$('#afit').checked?tplLayout(tctx.T,tctx.T.pres,size):null;return items.map(({s,x})=>tplSlideHtml(fillSlide(tctx.T.xml,tplVals(s,x),opt)))}catch(e){console.warn('Template preview failed:',e)}}
 const pt=uniformPt(size.map(i=>i.x));return items.map(({s,x})=>slideHtml(s.t,x,pt))}
const itemsOf=list=>list.flatMap(s=>secsOf(s).map(x=>({s,x})));
// Preview: the whole set grouped by song, or just the song you clicked.
function renderPrev(){const one=prev&&find(prev),shown=one?[one]:set.map(find),items=itemsOf(shown),size=[...itemsOf(set.map(find)),...(one&&!inSet(one.t)?items:[])];
 $('#ptitle').textContent=one?one.t:'Whole set';$('#pall').hidden=!one;$('#phint').hidden=!!items.length;
 if(tpl&&tctxFor!==tpl){$('#prev').innerHTML=items.length?'<p class="mut">Preparing template preview…</p>':'';return}
 const h=deckHtml(items,size);let i=0;
 $('#prev').innerHTML=shown.map(s=>{const n=secsOf(s).length,sl=h.slice(i,i+n);i+=n;
  return`<div class="song"><h3>${esc(s.t)}<span class="mut">${n} slide${n===1?'':'s'}</span></h3><div class="slides">${sl.map((x,k)=>`<figure>${x}<figcaption>${k+1}</figcaption></figure>`).join('')}</div></div>`}).join('')}
function renderAll(){renderLib();renderSet();renderPrev()}
