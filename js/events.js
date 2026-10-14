// UI events: tabs, filters, set editing.
// ---- events ----
function toggle(t){const i=set.indexOf(t);i<0?set.push(t):set.splice(i,1)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const row=b.closest('[data-t]'),t=row.dataset.t,a=b.dataset.a,i=+row.dataset.i;
 if(a==='v'){prev=t;setTimeout(()=>$('#pcard').scrollIntoView({behavior:'smooth',block:'start'}))}else if(a==='t'){toggle(t)}else if(a==='r'){set.splice(i,1)}
 else if(a==='u'&&i>0){[set[i-1],set[i]]=[set[i],set[i-1]]}else if(a==='dn'&&i<set.length-1){[set[i+1],set[i]]=[set[i],set[i+1]]}
 else if(a==='d'){if(!confirm('Delete “'+t+'” from your added songs?'))return;added=added.filter(s=>s.t!==t);ls.set('lw_added',added)}
 renderAll()});
['#q','#fs','#ft'].forEach(s=>$(s).addEventListener('input',renderLib));
$('#th').onchange=e=>{theme=e.target.value;renderPrev();renderAddPrev()};
$('#fmt').onchange=e=>{fmt=e.target.checked;renderAll()};
$('#afit').onchange=()=>{renderPrev();renderAddPrev()};
$('#pall').onclick=()=>{prev=null;renderPrev()};
$('#clr').onclick=()=>{set=[];renderAll()};
function tab(a){$('#pLib').hidden=a;$('#pAdd').hidden=!a;$('#tLib').classList.toggle('on',!a);$('#tAdd').classList.toggle('on',a)}
$('#tLib').onclick=()=>tab(false);$('#tAdd').onclick=()=>tab(true);
function fillSel(){const u=k=>[...new Set(songs().map(s=>s[k]).filter(Boolean))].sort();
 [['#fs','s'],['#ns','s'],['#ft','ty'],['#nty','ty']].forEach(([id,k])=>{const sel=$(id),keep=sel.value;[...sel.options].slice(1).forEach(o=>o.remove());u(k).forEach(v=>sel.add(new Option(v,v)));sel.value=keep})}
