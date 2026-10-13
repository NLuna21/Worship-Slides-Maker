// Spreadsheet import/export, file saving, and the built-in-design PowerPoint export.
// ---- import / export ----
$('#imp').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
 const imp=parseSongs(XLSX.read(await f.arrayBuffer(),{type:'array'}));
 if(!imp.length)throw new Error('no songs found');base=imp;ls.set('lw_base',base);fillSel();renderAll();say($('#msg'),'Database updated: '+imp.length+' songs loaded.')}
 catch(err){say($('#msg'),'Could not read that spreadsheet ('+err.message+').',1)}e.target.value=''};
$('#rst').onclick=()=>{if(!confirm('Revert to the original database? Your added songs are kept.'))return;base=SEED;ls.del('lw_base');renderAll();loadDb()};
async function save(name,data){let dl=null;try{dl=window.claude?await claude.use('downloads'):null}catch(e){}
 try{if(dl)await dl.save({filename:name,data});else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data]));a.download=name;a.click()}say($('#msg'),'Saved '+name)}
 catch(e){if(e&&e.code==='declined')return;say($('#msg'),'Could not save: '+(e.message||e.code),1)}}
$('#expAdd').onclick=()=>{if(!added.length)return say($('#msg'),'You haven’t added any songs yet.',1);
 const rows=[['Song Title','','Songwriter(s)','','','Camelot 1','','','','','','Season','Type','','','','Lyrics sections →']];
 added.forEach(s=>{const r=new Array(16).fill('');r[0]=s.t;r[2]=s.w;r[5]=s.k;r[11]=s.s;r[12]=s.ty;rows.push(r.concat(s.secs))});
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'New Songs');save('new-songs.xlsx',XLSX.write(wb,{bookType:'xlsx',type:'array'}))};
$('#exp').onclick=async()=>{if(tpl)return exportTpl();const pt=setPt();const p=new PptxGenJS(),c=THEMES[theme];p.layout='LAYOUT_16x9';p.title='Worship Slides';
 set.map(find).forEach(s=>secsOf(s).forEach(x=>{const sl=p.addSlide();sl.background={color:c.bg};
  sl.addText(s.t,{x:SLIDE.mx,y:SLIDE.titleY,w:SLIDE_BODY_W,h:.5,margin:0,fontSize:16,bold:true,color:c.ac,fontFace:'Calibri'});
  sl.addText(x,{x:SLIDE.mx,y:SLIDE.bodyY,w:SLIDE_BODY_W,h:SLIDE.bodyH,margin:0,fit:'shrink',fontSize:pt,color:c.fg,align:'center',valign:'middle',fontFace:'Calibri'})}));
 try{save('Worship-Slides-'+new Date().toISOString().slice(0,10)+'.pptx',await p.write({outputType:'arraybuffer'}))}catch(e){say($('#msg'),'Could not build slides: '+e.message,1)}};
