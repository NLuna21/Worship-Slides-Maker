// Add-a-song form: live preview, auto-format on paste/blur, save.
// ---- add song ----
function renderAddPrev(){const t=$('#nt').value.trim()||'Song title',s=splitLyrics($('#nl').value);$('#acnt').textContent=s.length+' slides';$('#aprev').innerHTML=s.map(x=>slideHtml(t,x)).join('')}
['#nt','#nl'].forEach(s=>$(s).addEventListener('input',renderAddPrev));
$('#save').onclick=()=>{const t=$('#nt').value.trim(),secs=splitLyrics($('#nl').value),m=$('#amsg');
 if(!t)return say(m,'Please enter a song title.',1);if(!secs.length)return say(m,'Please paste the lyrics.',1);
 if(find(t))return say(m,'A song with that title already exists.',1);
 added.push({t,w:$('#nw').value.trim(),k:$('#nk').value.trim(),s:$('#ns').value,ty:$('#nty').value,secs,added:1});ls.set('lw_added',added);
 if($('#nadd').checked)set.push(t);prev=t;['#nt','#nw','#nk','#nl'].forEach(s=>$(s).value='');
 say(m,'Saved “'+t+'” ('+secs.length+' slides).');fillSel();renderAll();renderAddPrev()};
const fmtArea=()=>{const v=$('#nl').value;if(v.trim())$('#nl').value=splitLyrics(v).join('\n\n');renderAddPrev()};
$('#nl').addEventListener('blur',fmtArea);$('#nl').addEventListener('paste',()=>setTimeout(fmtArea,0));
