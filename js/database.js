// Song database: parses the Excel layout, and loads data/songs.xlsx when the app is served from a website.
// Layout (sheet "Song Database"): A title, C songwriter(s), F key, L season, M type, Q onward = one lyric section (slide) per column.
function parseSongs(wb){const ws=wb.Sheets['Song Database']||wb.Sheets[wb.SheetNames[0]],n=x=>x==='N/A'?'':String(x).trim();
 return XLSX.utils.sheet_to_json(ws,{header:1,defval:''}).slice(1).filter(r=>r[0]).map(r=>({t:String(r[0]).trim(),w:n(r[2]),k:n(r[5]),s:n(r[11]),ty:n(r[12]),
  secs:r.slice(16).map(x=>String(x).replace(/­/g,'').replace(/\r/g,'').trim()).filter(Boolean)})).filter(s=>s.secs.length)}
// On a website (http/https) the app reads data/songs.xlsx directly, so updating the Excel file is all that's needed.
// Falls back to the bundled copy (SEED) when opened as a plain file, or if the fetch fails.
// A spreadsheet you imported through the app (saved in this browser) still takes priority.
async function loadDb(){if(!/^https?:$/.test(location.protocol)||ls.get('lw_base',null))return;
 try{const r=await fetch('data/songs.xlsx',{cache:'no-cache'});if(!r.ok)return;const rows=parseSongs(XLSX.read(await r.arrayBuffer(),{type:'array'}));
  if(rows.length){base=rows;fillSel();renderAll();say($('#msg'),'Loaded '+rows.length+' songs from data/songs.xlsx')}}catch(e){}}
