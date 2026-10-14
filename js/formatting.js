// Lyric formatting rules from the sheet (4-5 lines, no end punctuation, capitalised) + auto-fit.
// ---- formatting rules from the sheet ----
function cleanLine(l){l=l.replace(/\u00ad/g,'').replace(/\s+/g,' ').trim();if(!l)return'';if(!/:$/.test(l))l=l.replace(/[,.;!?…]+$/,'').trim();return l.replace(/^([^A-Za-z]*)([a-z])/,(m,a,b)=>a+b.toUpperCase())}
const cleanSec=x=>x.split('\n').map(cleanLine).join('\n').replace(/^\n+|\n+$/g,'');
const secsOf=s=>fmt?s.secs.flatMap(x=>splitLyrics(x)):s.secs;
function splitLyrics(raw){const out=[];raw.replace(/\r/g,'').replace(/^[ \t]*[\[(]?\s*(?:verse|chorus|pre-?chorus|bridge|intro|outro|tag|refrain|interlude|instrumental|ending|hook)\s*\d*\s*[\])]?:?[ \t]*$/gim,'').split(/\n\s*\n/).forEach(b=>{const L=b.split('\n').map(cleanLine).filter(Boolean);if(!L.length)return;
 const parts=Math.ceil(L.length/5),bs=Math.floor(L.length/parts),ex=L.length%parts;let i=0;
 for(let p=0;p<parts;p++){const n=bs+(p<ex?1:0);out.push(L.slice(i,i+n).join('\n'));i+=n}});return out}
function slideHtml(title,text,pt){const c=THEMES[theme];return `<div class="slide" style="background:#${c.bg};color:#${c.fg}"><div class="st" style="color:#${c.ac};white-space:nowrap;font-size:${(oneLinePt(title,SLIDE_BODY_W,16,9)/7.2).toFixed(2)}cqw">${esc(title)}</div><div class="sb" style="font-size:${((pt||fitPt(text))/7.2).toFixed(2)}cqw">${esc(text)}</div></div>`}

// ---- auto-fit: choose the largest font size (pt) whose wrapped text fits the box ----
const _ctx=(()=>{try{const c=document.createElement('canvas').getContext('2d');c.font='100px Arial, Helvetica, sans-serif';return c}catch(e){return null}})();
const textW=(s,pt,bold)=>{let w=s.length*(bold?58:55);if(_ctx){_ctx.font=(bold?'bold ':'')+'100px Arial, Helvetica, sans-serif';w=_ctx.measureText(s).width}return w*pt/100};   // Arial is wider than Calibri, so this errs on the safe side
// Largest font size (<= max pt) at which `text` fits on ONE line of wIn inches (never below min). Used for song titles.
const oneLinePt=(text,wIn,max,min=8,bold=true)=>{const w=wIn*72;for(let s=max;s>min;s--){if(textW(text,s,bold)*1.08<=w)return s}return min};
function wrapCount(line,pt,wPt){if(!line.trim())return 1;let n=1,cur='';for(const w of line.split(' ')){const t=cur?cur+' '+w:w;if(cur&&textW(t,pt)>wPt){n++;cur=w}else cur=t}return n}
// Prefers one-line-per-lyric-line: wrapping is only allowed once the size drops to `nw` pt or below.
function fitPt(text,wIn=SLIDE_BODY_W,hIn=SLIDE.bodyH,max=40,min=18,nw=Infinity){const w=wIn*72*.95,h=hIn*72*.95,L=text.split('\n');
 for(let s=max;s>min;s--){const n=L.reduce((a,l)=>a+wrapCount(l,s,w),0);if(n*s*1.2<=h&&(n===L.length||s<=nw))return s}return min}
// ONE size for every slide in a deck = the smallest size any section needs, so text is uniform.
const uniformPt=(texts,wIn,hIn,max=40,min=18,nw=28)=>texts.length?Math.min(...texts.map(t=>fitPt(t,wIn,hIn,max,min,nw))):max;
const setPt=()=>uniformPt(set.flatMap(t=>secsOf(find(t))));

