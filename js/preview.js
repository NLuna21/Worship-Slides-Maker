// Template slide preview: draws the imported .pptx design as HTML (backgrounds, pictures, shapes, fonts, colours,
// inherited layout/master styles), using the same filled-in slide XML the export writes, so what you see is what you get.
// Everything is positioned in container units: 1 EMU = 100/W cqw, so slides scale to any card width.
const PNS={a:'http://schemas.openxmlformats.org/drawingml/2006/main',p:'http://schemas.openxmlformats.org/presentationml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships'};
let tctx=null,tctxFor=null;   // parsed template, and which tpl object it was built from
const kid=(el,n)=>el&&[...el.childNodes].find(c=>c.localName===n)||null;   // first direct child by local name
const kids=(el,n)=>el?[...el.childNodes].filter(c=>c.nodeType===1&&(!n||c.localName===n)):[];
const xmlDoc=s=>new DOMParser().parseFromString(s,'application/xml');
const MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',webp:'image/webp',bmp:'image/bmp'};
const SYS_FONTS=/^(arial|helvetica|calibri|cambria|times new roman|georgia|verdana|tahoma|trebuchet ms|courier new|segoe ui|impact|garamond|century gothic|gill sans|futura|avenir|optima|baskerville|didot|palatino|symbol|wingdings)/i;

// ---- loading: slide -> layout -> master -> theme, plus every image they reference (as blob URLs) ----
async function relsOf(zip,path){const d=path.slice(0,path.lastIndexOf('/')),f=zip.file(d+'/_rels/'+path.slice(d.length+1)+'.rels'),m={};if(!f)return m;
 for(const r of xmlDoc(await f.async('string')).getElementsByTagName('Relationship')){let t=r.getAttribute('Target');if(r.getAttribute('TargetMode')==='External')continue;
  const p=t[0]==='/'?t.slice(1):(d+'/'+t).split('/').reduce((a,s)=>(s==='..'?a.pop():s!=='.'&&a.push(s),a),[]).join('/');m[r.getAttribute('Id')]={type:r.getAttribute('Type').split('/').pop(),path:p}}
 return m}
async function prepTplPreview(){if(!tpl){tctx=tctxFor=null;return}if(tctxFor===tpl)return;const mine=tpl;
 try{const zip=await JSZip.loadAsync(tpl.buf),T=await tplScan(zip),part=async p=>{const f=zip.file(p);return f?{path:p,doc:xmlDoc(await f.async('string')),rels:await relsOf(zip,p)}:null};
  const sd=/<p:sldSz[^>]*>/.exec(T.pres),W=+/\bcx="(\d+)"/.exec(sd[0])[1],H=+/\bcy="(\d+)"/.exec(sd[0])[1];
  const slide={path:T.path,rels:await relsOf(zip,T.path)},find1=(rels,t)=>Object.values(rels).find(r=>r.type===t);
  const layout=find1(slide.rels,'slideLayout')&&await part(find1(slide.rels,'slideLayout').path),master=layout&&find1(layout.rels,'slideMaster')&&await part(find1(layout.rels,'slideMaster').path);
  const themeP=master&&find1(master.rels,'theme')&&await part(find1(master.rels,'theme').path);
  const clr={},fonts={mj:'Calibri Light',mn:'Calibri'},cmap={bg1:'lt1',tx1:'dk1',bg2:'lt2',tx2:'dk2'};
  if(themeP){const cs=themeP.doc.getElementsByTagNameNS(PNS.a,'clrScheme')[0];kids(cs).forEach(c=>{const v=kids(c)[0];if(v)clr[c.localName]=v.getAttribute('lastClr')||v.getAttribute('val')});
   const fs=themeP.doc.getElementsByTagNameNS(PNS.a,'fontScheme')[0];[['mj','majorFont'],['mn','minorFont']].forEach(([k,n])=>{const l=kid(kid(fs,n),'latin');if(l&&l.getAttribute('typeface'))fonts[k]=l.getAttribute('typeface')})}
  const cm=master&&master.doc.getElementsByTagNameNS(PNS.p,'clrMap')[0];if(cm)[...cm.attributes].forEach(a=>cmap[a.name]=a.value);
  const img={};for(const p of [slide,layout,master].filter(Boolean))for(const r of Object.values(p.rels))if(r.type==='image'&&!img[r.path]&&zip.file(r.path)){
   const ext=r.path.split('.').pop().toLowerCase();if(MIME[ext])img[r.path]=URL.createObjectURL(new Blob([await zip.file(r.path).async('arraybuffer')],{type:MIME[ext]}))}
  const dts=xmlDoc(T.pres).getElementsByTagNameNS(PNS.p,'defaultTextStyle')[0];
  if(tpl!==mine)return;if(tctx)Object.values(tctx.img).forEach(u=>URL.revokeObjectURL(u));
  tctx={T,W,H,slide,layout,master,clr,cmap,fonts,img,dts,loaded:new Set()};tctxFor=mine}
 catch(e){console.warn('Template preview unavailable:',e);tctx=null;tctxFor=mine}}

// ---- colours: srgb / scheme / sys / preset, with lumMod, lumOff, tint, shade and alpha ----
function hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return[0,0,l];const d=mx-mn,s=l>.5?d/(2-mx-mn):d/(mx+mn);
 const h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;return[h/6,s,l]}
function rgb(h,s,l){if(!s)return[l,l,l].map(v=>v*255);const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return[f(h+1/3),f(h),f(h-1/3)].map(v=>v*255)}
function colorOf(holder,fallback){const c=holder&&kids(holder).find(n=>/Clr$/.test(n.localName));if(!c)return fallback||null;let hex='000000';const v=c.getAttribute('val');
 if(c.localName==='srgbClr')hex=v;else if(c.localName==='sysClr')hex=c.getAttribute('lastClr')||(v==='window'?'FFFFFF':'000000');
 else if(c.localName==='schemeClr'){if(v==='phClr')return fallback||null;hex=tctx.clr[tctx.cmap[v]||v]||'000000'}
 else if(c.localName==='prstClr')hex={white:'FFFFFF',black:'000000',red:'FF0000',green:'008000',blue:'0000FF',yellow:'FFFF00',gray:'808080'}[v]||'000000';
 let[r,g,b]=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)),a=1;const mod=n=>{const m=kid(c,n);return m?+m.getAttribute('val')/1e5:null};
 if(mod('lumMod')!==null||mod('lumOff')!==null){const[h,s,l]=hsl(r,g,b);[r,g,b]=rgb(h,s,Math.min(1,Math.max(0,l*(mod('lumMod')??1)+(mod('lumOff')??0))))}
 if(mod('tint')!==null){const t=mod('tint');[r,g,b]=[r,g,b].map(x=>x+(255-x)*(1-t))}if(mod('shade')!==null){const t=mod('shade');[r,g,b]=[r,g,b].map(x=>x*t)}
 if(mod('alpha')!==null)a=mod('alpha');return`rgba(${[r,g,b].map(Math.round).join(',')},${+a.toFixed(3)})`}

// ---- fills: solid, gradient, picture ----
const pct=(n,k,d=0)=>n&&n.getAttribute(k)?+n.getAttribute(k)/1e3:d;   // OOXML 1/1000 of a percent -> percent
function picHtml(bf,rels,extra=''){const bl=kid(bf,'blip'),r=bl&&rels[bl.getAttributeNS(PNS.r,'embed')],url=r&&tctx.img[r.path];if(!url)return'';
 const src=kid(bf,'srcRect'),fr=kid(kid(bf,'stretch'),'fillRect'),am=kid(bl,'alphaModFix'),op=am?+am.getAttribute('amt')/1e5:1;
 const[fl,ft,fr2,fb]=['l','t','r','b'].map(k=>pct(fr,k)),[sl,st,sr,sb]=['l','t','r','b'].map(k=>pct(src,k)),sw=100-sl-sr||100,sh=100-st-sb||100;
 return`<div style="position:absolute;overflow:hidden;left:${fl}%;top:${ft}%;width:${100-fl-fr2}%;height:${100-ft-fb}%;opacity:${op}${extra}"><img src="${url}" alt="" style="position:absolute;max-width:none;left:${-sl/sw*100}%;top:${-st/sh*100}%;width:${1e4/sw}%;height:${1e4/sh}%"></div>`}
function fillCss(sp,rels,ph){const s=kid(sp,'solidFill');if(s)return{bg:colorOf(s,ph)};const g=kid(sp,'gradFill');
 if(g){const st=kids(kid(g,'gsLst'),'gs').map(x=>colorOf(x,ph)+' '+pct(x,'pos')+'%').join(','),lin=kid(g,'lin');
  return{bg:kid(g,'path')?`radial-gradient(circle,${st})`:`linear-gradient(${(lin?+lin.getAttribute('ang')/6e4:0)+90}deg,${st})`}}
 const b=kid(sp,'blipFill');if(b)return{pic:picHtml(b,rels)};return null}

// ---- placeholders inherit position, body and text styles from the layout, then the master ----
const phOf=sp=>{const nv=kids(sp).find(n=>/^nv/.test(n.localName)),ph=nv&&kid(kid(nv,'nvPr'),'ph');return ph?{type:ph.getAttribute('type')||'body',idx:ph.getAttribute('idx')}:null};
function phMatch(part,ph){if(!part||!ph)return null;const all=[...part.doc.getElementsByTagNameNS(PNS.p,'sp')].map(sp=>({sp,ph:phOf(sp)})).filter(x=>x.ph);
 const norm=t=>t==='ctrTitle'?'title':t==='subTitle'||t==='obj'?'body':t;
 return(ph.idx!=null&&all.find(x=>x.ph.idx===ph.idx&&norm(x.ph.type)===norm(ph.type)))||all.find(x=>norm(x.ph.type)===norm(ph.type))||(ph.idx!=null&&all.find(x=>x.ph.idx===ph.idx))||null}
function chainFor(sp,part){const ph=phOf(sp);if(!ph||part===tctx.master)return{ph,list:[sp]};
 const lay=part===tctx.layout?null:phMatch(tctx.layout,ph),mas=phMatch(tctx.master,ph);return{ph,list:[sp,lay&&lay.sp,mas&&mas.sp].filter(Boolean)}}
const xfrmOf=list=>{for(const sp of list){const x=kid(kid(sp,'spPr')||kid(sp,'grpSpPr'),'xfrm');if(x&&kid(x,'off')&&kid(x,'ext'))return x}return null};

// ---- text ----
function textHtml(sp,chain,part){const tx=kid(sp,'txBody');if(!tx)return'';const paras=kids(tx,'p');if(!paras.some(p=>kids(p,'r').length||kids(p,'fld').length))return'';
 const bodies=chain.list.map(s=>kid(kid(s,'txBody'),'bodyPr')).filter(Boolean),bp=k=>{for(const b of bodies)if(b.hasAttribute(k))return b.getAttribute(k);return null};
 const fit=bodies.map(b=>kid(b,'normAutofit')).find(Boolean),scale=fit&&fit.getAttribute('fontScale')?+fit.getAttribute('fontScale')/1e5:1;
 const t=chain.ph&&chain.ph.type,master=tctx.master&&kid(kid(tctx.master.doc.documentElement,'txStyles'),t==='title'||t==='ctrTitle'?'titleStyle':chain.ph?'bodyStyle':'otherStyle');
 const lists=[...chain.list.map(s=>kid(kid(s,'txBody'),'lstStyle')),master,chain.ph?null:tctx.dts].filter(Boolean);
 const e=v=>(v/tctx.W*100).toFixed(3)+'cqw',ins=(k,d)=>e(+(bp(k)??d));
 const anchor={t:'flex-start',ctr:'center',b:'flex-end'}[bp('anchor')||'t'],nowrap=bp('wrap')==='none';
 let html='';for(const p of paras){const pPr=kid(p,'pPr'),lvl=+(pPr&&pPr.getAttribute('lvl')||0),lv=lists.map(l=>kid(l,'lvl'+(lvl+1)+'pPr')).filter(Boolean),pp=[pPr,...lv].filter(Boolean);
  const pa=k=>{for(const n of pp)if(n.hasAttribute(k))return n.getAttribute(k);return null},pc=n=>{for(const x of pp){const c=kid(x,n);if(c)return c}return null};
  const defs=lv.map(l=>kid(l,'defRPr')).filter(Boolean),ln=pc('lnSpc'),lnPct=kid(ln,'spcPct'),lnPts=kid(ln,'spcPts');
  const run=(rPr,txt)=>{const rp=[rPr,...defs].filter(Boolean),ra=k=>{for(const n of rp)if(n.hasAttribute(k))return n.getAttribute(k);return null},rc=n=>{for(const x of rp){const c=kid(x,n);if(c)return c}return null};
   const sz=+(ra('sz')||1800)/100*scale,lat=rc('latin'),tf=lat&&lat.getAttribute('typeface'),face=!tf||tf==='+mn-lt'?tctx.fonts.mn:tf==='+mj-lt'?tctx.fonts.mj:tf;
   const b=ra('b')==='1'||ra('b')==='true',it=ra('i')==='1'||ra('i')==='true',font=fontCss(face,b,it),fill=rc('solidFill'),cap=ra('cap');
   const css=`font-size:${e(sz*12700)};${font};color:${colorOf(fill)||'#'+(tctx.clr[tctx.cmap.tx1]||'000000')}${cap==='all'?';text-transform:uppercase':cap==='small'?';font-variant:small-caps':''}${ra('u')&&ra('u')!=='none'?';text-decoration:underline':''}`;
   return{css,sz,html:`<span style="${css}">${esc(txt)}</span>`}};
  let inner='',maxSz=0;for(const n of kids(p)){if(n.localName==='r'||n.localName==='fld'){const r=run(kid(n,'rPr'),(kid(n,'t')||{}).textContent||'');inner+=r.html;maxSz=Math.max(maxSz,r.sz)}
   else if(n.localName==='br')inner+='<br>'}
  if(!inner){const r=run(kid(p,'endParaRPr'),'​');inner=r.html;maxSz=r.sz}
  const lh=lnPts?`line-height:${e(+lnPts.getAttribute('val')/100*12700)}`:`line-height:${(lnPct?+lnPct.getAttribute('val')/1e5:1)*1.2}`;
  const sb=kid(pc('spcBef'),'spcPts'),sa=kid(pc('spcAft'),'spcPts'),al={l:'left',ctr:'center',r:'right',just:'justify',dist:'justify'}[pa('algn')||'l'];
  html+=`<div style="text-align:${al};${lh};margin:${sb?e(+sb.getAttribute('val')/100*12700):0} 0 ${sa?e(+sa.getAttribute('val')/100*12700):0};padding-left:${e(+(pa('marL')||0))}">${inner}</div>`}
 return`<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:${anchor};padding:${ins('tIns',45720)} ${ins('rIns',91440)} ${ins('bIns',45720)} ${ins('lIns',91440)};white-space:${nowrap?'pre':'pre-wrap'};overflow-wrap:break-word">${html}</div>`}

// Fonts: maps "Spectral SemiBold" -> family "Spectral" at weight 600 and asks Google Fonts for it (system fonts are left alone).
const WEIGHTS={thin:100,hairline:100,extralight:200,ultralight:200,light:300,regular:400,book:400,normal:400,medium:500,semibold:600,demibold:600,bold:700,extrabold:800,ultrabold:800,black:900,heavy:900};
function fontCss(face,bold,italic){let fam=face,w=bold?700:400;const m=/^(.*?)[\s-]+(thin|hairline|extra ?light|ultra ?light|light|regular|book|normal|medium|semi ?bold|demi ?bold|extra ?bold|ultra ?bold|bold|black|heavy)$/i.exec(face);
 if(m){fam=m[1];w=WEIGHTS[m[2].replace(/\s/g,'').toLowerCase()];if(bold&&w<700)w=700}
 if(!SYS_FONTS.test(fam)){const key=fam+':'+(italic?1:0)+','+w;if(!tctx.loaded.has(key)){tctx.loaded.add(key);const l=document.createElement('link');l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(fam).replace(/%20/g,'+')+':ital,wght@'+(italic?1:0)+','+w+'&display=swap';document.head.appendChild(l)}}
 return`font-family:'${face.replace(/'/g,'')}','${fam.replace(/'/g,'')}',${/serif|spectral|garamond|times|georgia|playfair|merriweather|lora|baskerville/i.test(fam)?'Georgia,serif':'Arial,Helvetica,sans-serif'};font-weight:${w};font-style:${italic?'italic':'normal'}`}

// ---- shapes ----
function shapeHtml(sp,part,map){const n=sp.localName;if(n==='grpSp'){const x=xfrmOf([sp]);if(!x)return'';const o=kid(x,'off'),ex=kid(x,'ext'),co=kid(x,'chOff'),ce=kid(x,'chExt');
  const sx=ce&&+ce.getAttribute('cx')?+ex.getAttribute('cx')/+ce.getAttribute('cx'):1,sy=ce&&+ce.getAttribute('cy')?+ex.getAttribute('cy')/+ce.getAttribute('cy'):1;
  const inner=(X,Y,Wd,Hd)=>map(+o.getAttribute('x')+(X-(co?+co.getAttribute('x'):0))*sx,+o.getAttribute('y')+(Y-(co?+co.getAttribute('y'):0))*sy,Wd*sx,Hd*sy);
  return kids(sp).map(c=>shapeHtml(c,part,inner)).join('')}
 if(n!=='sp'&&n!=='pic'&&n!=='cxnSp')return'';
 const chain=chainFor(sp,part);if(part!==tctx.slide&&chain.ph)return'';   // layout/master placeholders are prompts, not content
 const x=xfrmOf(chain.list);if(!x)return'';const o=kid(x,'off'),ex=kid(x,'ext'),[L,T,Wd,Hd]=map(+o.getAttribute('x'),+o.getAttribute('y'),+ex.getAttribute('cx'),+ex.getAttribute('cy'));
 const spPr=kid(sp,'spPr'),pg=kid(spPr,'prstGeom'),geo=pg&&pg.getAttribute('prst'),e=v=>(v/tctx.W*100).toFixed(3)+'cqw';
 const rot=x.getAttribute('rot')?+x.getAttribute('rot')/6e4:0,flip=(x.getAttribute('flipH')==='1'?' scaleX(-1)':'')+(x.getAttribute('flipV')==='1'?' scaleY(-1)':'');
 let css=`position:absolute;left:${e(L)};top:${e(T)};width:${e(Wd)};height:${e(Hd)}`+(rot||flip?`;transform:rotate(${rot}deg)${flip}`:'')+(geo==='ellipse'?';border-radius:50%':geo==='roundRect'?`;border-radius:${e(Math.min(Wd,Hd)*.1667)}`:'');
 let body='';const style=kid(sp,'style');
 if(n==='pic'){const bf=kid(sp,'blipFill');css+=';overflow:hidden';body=picHtml(bf,part.rels)}
 else if(spPr&&!kid(spPr,'noFill')){const f=fillCss(spPr,part.rels)||(()=>{const r=kid(style,'fillRef');return r&&+r.getAttribute('idx')>0?{bg:colorOf(r)}:null})();
  if(f&&f.bg)css+=';background:'+f.bg;if(f&&f.pic){css+=';overflow:hidden';body=f.pic}}
 const ln=kid(spPr,'ln');if(ln&&!kid(ln,'noFill')){const c=colorOf(kid(ln,'solidFill'))||(kid(style,'lnRef')&&!kid(ln,'solidFill')&&+kid(style,'lnRef').getAttribute('idx')>0?colorOf(kid(style,'lnRef')):null);
  if(c){const w=Math.max(+(ln.getAttribute('w')||12700),6350);css+=n==='cxnSp'?`;border-top:${e(w)} solid ${c};height:0`:`;box-shadow:inset 0 0 0 ${e(w)} ${c}`}}
 return`<div style="${css}">${body}${n==='sp'?textHtml(sp,chain,part):''}</div>`}
const treeHtml=part=>{const tree=part&&part.doc.getElementsByTagNameNS(PNS.p,'spTree')[0];return tree?kids(tree).map(c=>shapeHtml(c,part,(x,y,w,h)=>[x,y,w,h])).join(''):''};
const showsMaster=part=>!part||part.doc.documentElement.getAttribute('showMasterSp')!=='0';
function bgHtml(parts){for(const p of parts){const bg=p&&kid(kid(p.doc.documentElement,'cSld'),'bg');if(!bg)continue;
  const pr=kid(bg,'bgPr');if(pr){const f=fillCss(pr,p.rels);if(f)return f.pic?`<div style="position:absolute;inset:0;overflow:hidden">${f.pic}</div>`:`<div style="position:absolute;inset:0;background:${f.bg}"></div>`}
  const ref=kid(bg,'bgRef');if(ref)return`<div style="position:absolute;inset:0;background:${colorOf(ref)}"></div>`}
 return'<div style="position:absolute;inset:0;background:#fff"></div>'}

// One filled slide (XML string from fillSlide) -> HTML. The layout/master layers are cached since they're the same on every slide.
function tplSlideHtml(xml){const slide={path:tctx.slide.path,rels:tctx.slide.rels,doc:xmlDoc(xml)};
 if(!tctx.under){const lay=showsMaster(tctx.layout)?treeHtml(tctx.master):'';tctx.under={bgParts:[tctx.layout,tctx.master],html:lay+treeHtml(tctx.layout)}}
 const cur={...tctx};tctx.slide=slide;try{return`<div class="slide" style="aspect-ratio:${tctx.W}/${tctx.H}">${bgHtml([slide,...tctx.under.bgParts])}${showsMaster(slide)?tctx.under.html:''}${treeHtml(slide)}</div>`}
 finally{tctx.slide=cur.slide}}
