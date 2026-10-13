// Custom .pptx template: keeps its design, duplicates the {{Lyrics}} slide per section.
// ---- custom template (.pptx with {{Song Title}} / {{Lyrics}}) ----
const idb={open(){return new Promise((ok,no)=>{const r=indexedDB.open('lw',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})},
 async run(mode,fn){try{const d=await this.open();return await new Promise((ok,no)=>{const t=d.transaction('kv',mode),q=fn(t.objectStore('kv'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})}catch(e){return null}}};
let tpl=null;
function renderTpl(){$('#tinfo').textContent=tpl?'Using your template: '+tpl.name:'Built-in design (import a .pptx to use your own)';$('#trm').hidden=!tpl;$('#th').disabled=!!tpl}
renderTpl();idb.run('readonly',s=>s.get('tpl')).then(v=>{if(v&&v.buf){tpl=v;renderTpl()}});
const rx=s=>s.replace(/[.*+?^$|()\[\]{}\\]/g,'\\$&');
async function tplScan(zip){const rd=async p=>zip.file(p)?zip.file(p).async('string'):null;
 const pres=await rd('ppt/presentation.xml'),rels=await rd('ppt/_rels/presentation.xml.rels');if(!pres||!rels)throw new Error('not a valid .pptx');
 const rmap={};(rels.match(/<Relationship\b[^>]*>/g)||[]).forEach(m=>{rmap[/\bId="([^"]+)"/.exec(m)[1]]=/Target="([^"]+)"/.exec(m)[1]});
 for(const m of pres.match(/<p:sldId\b[^>]*>/g)||[]){const rid=/r:id="([^"]+)"/.exec(m)[1],tg=rmap[rid],path=tg[0]==='/'?tg.slice(1):'ppt/'+tg,xml=await rd(path);if(!xml)continue;
  const txt=(xml.match(/<a:t(?:\s[^>]*)?>[^<]*<\/a:t>/g)||[]).map(x=>x.replace(/<[^>]+>/g,'')).join('');
  if(/\{\{\s*lyrics\s*\}\}/i.test(txt))return{pres,rels,rd,tag:m,id:+/ id="(\d+)"/.exec(m)[1],rid,path,xml}}
 return null}
function fillSlide(xml,vals,opt){const A='http://schemas.openxmlformats.org/drawingml/2006/main',doc=new DOMParser().parseFromString(xml,'application/xml');
 [...doc.getElementsByTagNameNS(A,'p')].forEach(p=>{const runs=[...p.childNodes].filter(n=>n.localName==='r'&&n.namespaceURI===A);if(!runs.length)return;
  const txt=runs.map(r=>(r.getElementsByTagNameNS(A,'t')[0]||{}).textContent||'').join('');if(!/\{\{[^}]+\}\}/.test(txt))return;
  const out=txt.replace(/\{\{\s*([^}]+?)\s*\}\}/g,(m,k)=>{const v=vals[k.toLowerCase()];return v===undefined?m:v});
  const first=runs[0];let rPr=first.getElementsByTagNameNS(A,'rPr')[0];runs.slice(1).forEach(r=>p.removeChild(r));if(opt&&/\{\{\s*lyrics\s*\}\}/i.test(txt)){if(!rPr){rPr=doc.createElementNS(A,'a:rPr');first.insertBefore(rPr,first.firstChild)}rPr.setAttribute('sz',String(opt.pt*100));fitBox(p,doc,opt.box)}
  const lines=out.split('\n'),ref=first.nextSibling;first.getElementsByTagNameNS(A,'t')[0].textContent=lines[0];
  lines.slice(1).forEach(ln=>{const br=doc.createElementNS(A,'a:br');if(rPr)br.appendChild(rPr.cloneNode(true));const r=first.cloneNode(true);r.getElementsByTagNameNS(A,'t')[0].textContent=ln;p.insertBefore(br,ref);p.insertBefore(r,ref)})});
 let s=new XMLSerializer().serializeToString(doc);if(!/^<\?xml/.test(s))s='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+s;return s}
async function buildFromTpl(items){if(!items.length)throw new Error('your set is empty');
 const zip=await JSZip.loadAsync(tpl.buf),T=await tplScan(zip);if(!T)throw new Error('no slide contains {{Lyrics}}');
 const relsPath=T.path.replace('slides/','slides/_rels/')+'.rels';let srels=await T.rd(relsPath)||'',notes=null;
 srels=srels.replace(/<Relationship\b[^>]*notesSlide[^>]*\/>/g,m=>{notes='ppt/'+/Target="\.\.\/([^"]+)"/.exec(m)[1];return''});
 let ct=await T.rd('[Content_Types].xml'),prels=T.rels,pres=T.pres;const drop=p=>{ct=ct.replace(new RegExp('<Override[^>]*PartName="/'+rx(p)+'"[^>]*/>'),'')};
 let n=Math.max(0,...Object.keys(zip.files).map(f=>+((/^ppt\/slides\/slide(\d+)\.xml$/.exec(f)||[])[1]||0)));
 let nid=Math.max(255,...(pres.match(/<p:sldId\b[^>]*>/g)||[]).map(m=>+/ id="(\d+)"/.exec(m)[1]))+1;
 const tags=[],ids=[];let add='',radd='';const opt=$('#afit').checked?tplLayout(T,pres,items):null;
 for(const {s,x} of items){n++;const rid='rIdLW'+n,id=nid++,vals={'song title':s.t,title:s.t,lyrics:x,'songwriter(s)':s.w,songwriter:s.w,songwriters:s.w,writer:s.w,key:s.k};
  zip.file('ppt/slides/slide'+n+'.xml',fillSlide(T.xml,vals,opt));zip.file('ppt/slides/_rels/slide'+n+'.xml.rels',srels);
  add+='<Override PartName="/ppt/slides/slide'+n+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
  radd+='<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+n+'.xml"/>';
  tags.push('<p:sldId id="'+id+'" r:id="'+rid+'"/>');ids.push(id)}
 zip.remove(T.path);zip.remove(relsPath);drop(T.path);
 if(notes){zip.remove(notes);zip.remove(notes.replace('notesSlides/','notesSlides/_rels/')+'.rels');drop(notes)}
 prels=prels.replace(new RegExp('<Relationship\\b[^>]*Id="'+T.rid+'"[^>]*/>'),'').replace('</Relationships>',radd+'</Relationships>');
 pres=pres.replace(T.tag,tags.join('')).replace(new RegExp('<p14:sldId id="'+T.id+'"\\s*/>'),ids.map(i=>'<p14:sldId id="'+i+'"/>').join(''));
 zip.file('ppt/presentation.xml',pres);zip.file('ppt/_rels/presentation.xml.rels',prels);zip.file('[Content_Types].xml',ct.replace('</Types>',add+'</Types>'));
 return zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'})}
async function exportTpl(){try{const items=[];set.map(find).forEach(s=>secsOf(s).forEach(x=>items.push({s,x})));
 lastPt=0;const buf=await buildFromTpl(items);await save('Worship-Slides-'+new Date().toISOString().slice(0,10)+'.pptx',buf);if(lastPt)$('#msg').textContent+=' · lyrics set at '+lastPt+'pt on every slide'}catch(e){say($('#msg'),'Template error: '+e.message,1)}}
$('#tfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const buf=await f.arrayBuffer(),T=await tplScan(await JSZip.loadAsync(buf));if(!T)throw new Error('no slide contains {{Lyrics}}');
 tpl={name:f.name,buf};await idb.run('readwrite',s=>s.put(tpl,'tpl'));renderTpl();say($('#msg'),'Template loaded — its design will be used for your slides.')}catch(err){say($('#msg'),'Could not use that file: '+err.message,1)}e.target.value=''};
$('#trm').onclick=async()=>{tpl=null;await idb.run('readwrite',s=>s.delete('tpl'));renderTpl()};
$('#tsamp').onclick=async()=>{const p=new PptxGenJS();p.layout='LAYOUT_16x9';const s=p.addSlide();s.background={color:'14213D'};s.addText('{{Song Title}}',{x:SLIDE.mx,y:SLIDE.titleY,w:SLIDE_BODY_W,h:.5,margin:0,fontSize:16,bold:true,color:'FCA311'});s.addText('{{Lyrics}}',{x:SLIDE.mx,y:SLIDE.bodyY,w:SLIDE_BODY_W,h:SLIDE.bodyH,margin:0,fontSize:36,color:'FFFFFF',align:'center',valign:'middle'});save('Sample-Template.pptx',await p.write({outputType:'arraybuffer'}))};

let lastPt=0;
// Reads the slide size + the template's {{Lyrics}} box, and returns ONE font size and a safe-area box for the whole deck.
// Box: keeps the template's centre, at least 80% x 52% of the slide (so tiny boxes don't give tiny text), at most 84% x 84% (margins).
function tplLayout(T,pres,items){const A='http://schemas.openxmlformats.org/drawingml/2006/main',sd=/<p:sldSz[^>]*>/.exec(pres);if(!sd)return null;
 const W=+/\bcx="(\d+)"/.exec(sd[0])[1],H=+/\bcy="(\d+)"/.exec(sd[0])[1];
 const doc=new DOMParser().parseFromString(T.xml,'application/xml');let sp=null;
 for(const p of doc.getElementsByTagNameNS(A,'p')){const t=[...p.getElementsByTagNameNS(A,'t')].map(x=>x.textContent).join('');if(/\{\{\s*lyrics\s*\}\}/i.test(t)){sp=p;while(sp&&sp.localName!=='sp')sp=sp.parentNode;break}}
 const off=sp&&sp.getElementsByTagNameNS(A,'off')[0],ext=sp&&sp.getElementsByTagNameNS(A,'ext')[0],has=off&&ext&&ext.getAttribute('cx');
 const x0=has?+off.getAttribute('x'):0,y0=has?+off.getAttribute('y'):0,w0=has?+ext.getAttribute('cx'):0,h0=has?+ext.getAttribute('cy'):0;
 const cx=has?x0+w0/2:W/2,cy=has?y0+h0/2:H/2,cl=(v,a,b)=>Math.min(Math.max(v,a),b);
 // keep a clear gap from the {{Song Title}} shape (above or below the lyrics) so the two never collide
 let top=.07*H,bot=.93*H;for(const p of doc.getElementsByTagNameNS(A,'p')){const tt=[...p.getElementsByTagNameNS(A,'t')].map(q=>q.textContent).join('');if(!/\{\{\s*(song\s*)?title\s*\}\}/i.test(tt))continue;
  let ts=p;while(ts&&ts.localName!=='sp')ts=ts.parentNode;const o=ts&&ts.getElementsByTagNameNS(A,'off')[0],e=ts&&ts.getElementsByTagNameNS(A,'ext')[0];
  if(o&&e&&e.getAttribute('cx')){const ty=+o.getAttribute('y'),th=+e.getAttribute('cy'),g=.03*H;if(ty+th/2>H/2)bot=Math.min(bot,ty-g);else top=Math.max(top,ty+th+g)}break}
 const w=Math.round(cl(w0,.8*W,.84*W)),h=Math.round(Math.min(cl(h0,.52*H,.84*H),Math.max(bot-top,.3*H))),x=Math.round(cl(cx-w/2,.08*W,.92*W-w)),y=Math.round(cl(cy-h/2,top,Math.max(top,bot-h)));
 const u=H/12700/405;   // font sizes scale with slide height (405pt = a 10 x 5.625in slide)
 lastPt=uniformPt(items.map(i=>i.x),w/914400,h/914400,Math.round(46*u),Math.round(18*u),Math.round(30*u));
 return{pt:lastPt,box:{x,y,w,h}}}
// Moves/resizes the lyrics shape to the safe-area box, zero insets, centred, no auto-shrink (so our size is final).
function fitBox(p,doc,b){const A='http://schemas.openxmlformats.org/drawingml/2006/main';let sp=p;while(sp&&sp.localName!=='sp')sp=sp.parentNode;if(!sp)return;
 const spPr=[...sp.childNodes].find(n=>n.localName==='spPr');if(spPr){let xf=[...spPr.childNodes].find(n=>n.localName==='xfrm');
  if(!xf){xf=doc.createElementNS(A,'a:xfrm');spPr.insertBefore(xf,spPr.firstChild)}
  ['rot','flipH','flipV'].forEach(k=>xf.removeAttribute(k));[...xf.childNodes].forEach(c=>xf.removeChild(c));
  const o=doc.createElementNS(A,'a:off'),e=doc.createElementNS(A,'a:ext');o.setAttribute('x',b.x);o.setAttribute('y',b.y);e.setAttribute('cx',b.w);e.setAttribute('cy',b.h);xf.appendChild(o);xf.appendChild(e)}
 const bp=sp.getElementsByTagNameNS(A,'bodyPr')[0];if(bp){['lIns','rIns','tIns','bIns'].forEach(k=>bp.setAttribute(k,'0'));bp.setAttribute('wrap','square');bp.setAttribute('anchor','ctr');
  [...bp.childNodes].forEach(c=>{if(/Autofit$/.test(c.localName))bp.removeChild(c)});bp.appendChild(doc.createElementNS(A,'a:noAutofit'))}
 let pPr=[...p.childNodes].find(n=>n.localName==='pPr');if(!pPr){pPr=doc.createElementNS(A,'a:pPr');p.insertBefore(pPr,p.firstChild)}pPr.setAttribute('algn','ctr')}
