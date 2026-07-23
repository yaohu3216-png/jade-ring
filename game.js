(() => {
'use strict';
const TAU=Math.PI*2;
const chapters=[
 {name:'青玉章',jade:['#dffff3','#8ed7bd','#4e9e83'],bg:['#103f38','#092923'],quote:'君子比德于玉，温润而泽。'},
 {name:'羊脂白玉',jade:['#fffdf0','#efe2bd','#c9b487'],bg:['#8d7865','#41362e'],quote:'皎若凝脂，静若初雪。'},
 {name:'碧玉章',jade:['#c4efbf','#51a965','#1f693e'],bg:['#355c41','#142e24'],quote:'碧色含春，清光入怀。'},
 {name:'翡翠章',jade:['#d5ffd7','#45c879','#087a4c'],bg:['#0d5d48','#082f28'],quote:'翠色盈袖，生意自来。'},
 {name:'黄玉章',jade:['#fff0a8','#e2ae42','#8b5b18'],bg:['#76532f','#2f241b'],quote:'温金含光，厚德载物。'},
 {name:'紫玉章',jade:['#f0d6ff','#b77ce0','#67428e'],bg:['#5b476b','#221b2e'],quote:'烟霞入佩，紫气凝华。'},
 {name:'墨玉章',jade:['#8da0a0','#263c3c','#0b1516'],bg:['#313b3a','#0a1111'],quote:'墨色藏锋，静观万象。'},
 {name:'赤玉章',jade:['#ffd0c7','#d96b5f','#7d292b'],bg:['#6d3c3a','#271719'],quote:'丹心照玉，赤诚如初。'}
];
const gallery=document.querySelector('#gallery'),gameScreen=document.querySelector('#gameScreen'),grid=document.querySelector('#chapterGrid');
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const movesEl=document.querySelector('#moves'),chapterName=document.querySelector('#chapterName'),quoteEl=document.querySelector('#quote');
let soundOn=true,audioCtx=null,chapter=0,moves=0,selected=null,gesture=null,toastTimer=0;
let rings=[],clasps=[];

chapters.forEach((c,i)=>{const card=document.createElement('article');card.className='chapter-card';card.style.setProperty('--c1',c.bg[0]);card.style.setProperty('--c2',c.bg[1]);card.style.setProperty('--jade',c.jade[1]);card.innerHTML=`<h3>${c.name}</h3><p>${c.quote}</p><span class="badge">第一关 · 免费试玩</span><i class="sample-ring"></i>`;card.onclick=()=>startChapter(i);grid.appendChild(card)});

document.querySelector('#backBtn').onclick=()=>{gameScreen.classList.remove('active');gallery.classList.add('active')};
document.querySelector('#resetBtn').onclick=reset;
document.querySelector('#hintBtn').onclick=()=>showToast('先找只有一个金扣牵制、且缺口靠近金扣的外层玉环。');
document.querySelector('#soundBtn').onclick=()=>{soundOn=!soundOn;document.querySelector('#soundBtn').textContent=soundOn?'音':'静'};

function startChapter(i){chapter=i;gallery.classList.remove('active');gameScreen.classList.add('active');chapterName.textContent=chapters[i].name;quoteEl.textContent=chapters[i].quote;reset();requestAnimationFrame(fit)}
function reset(){moves=0;movesEl.textContent='0';selected=null;gesture=null;buildLevel();draw()}
function buildLevel(){
 rings=[
  ring('A',450,230,130,-Math.PI/2,0),
  ring('B',265,420,128,Math.PI,1),ring('C',635,420,128,0,2),
  ring('D',330,670,126,Math.PI*0.78,3),ring('E',570,670,126,Math.PI*0.22,4),
  ring('F',450,875,126,Math.PI/2,5)
 ];
 clasps=[
  clasp('ab',350,330,'A','B',-0.75),clasp('ac',550,330,'A','C',0.75),
  clasp('bc',450,470,'B','C',0),
  clasp('bd',300,555,'B','D',1.15),clasp('ce',600,555,'C','E',2.0),
  clasp('de',450,705,'D','E',0),clasp('df',365,790,'D','F',0.8),clasp('ef',535,790,'E','F',2.3)
 ];
 rings.forEach(r=>r.attach=clasps.filter(c=>c.a===r.id||c.b===r.id).map(c=>c.id));
}
function ring(id,x,y,r,gap,idn){return{id,x,y,r,thick:36,gap,removed:false,attach:[],z:idn,dragStart:null}}
function clasp(id,x,y,a,b,rot){return{id,x,y,a,b,rot,detached:{[a]:false,[b]:false}}}

function fit(){const rect=canvas.getBoundingClientRect();canvas.dataset.scale=rect.width/900;draw()}
addEventListener('resize',()=>requestAnimationFrame(fit));
function pos(ev){const rect=canvas.getBoundingClientRect();return{x:(ev.clientX-rect.left)*900/rect.width,y:(ev.clientY-rect.top)*1120/rect.height}}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
function down(e){canvas.setPointerCapture(e.pointerId);ensureAudio();const p=pos(e);const hit=[...rings].filter(r=>!r.removed).sort((a,b)=>b.z-a.z).find(r=>hitRing(r,p));if(!hit)return;selected=hit;const d=Math.hypot(p.x-hit.x,p.y-hit.y);gesture={id:e.pointerId,mode:d<rInner(hit)?'move':'rotate',sx:p.x,sy:p.y,ox:hit.x,oy:hit.y,og:hit.gap,lastAng:Math.atan2(p.y-hit.y,p.x-hit.x)};hit.z=99;draw()}
function move(e){if(!gesture||e.pointerId!==gesture.id||!selected)return;const p=pos(e);if(gesture.mode==='rotate'){const a=Math.atan2(p.y-selected.y,p.x-selected.x);selected.gap=norm(gesture.og+(a-gesture.lastAng));}
 else{const nx=gesture.ox+(p.x-gesture.sx),ny=gesture.oy+(p.y-gesture.sy);const prev={x:selected.x,y:selected.y};selected.x=clamp(nx,-180,1080);selected.y=clamp(ny,-180,1300);checkDetach(selected,prev);}
 draw()}
function up(e){if(!gesture||e.pointerId!==gesture.id)return;moves++;movesEl.textContent=moves;chime(.12);if(selected&&!selected.removed&&selected.attach.every(id=>isDetached(id,selected.id))&&outside(selected)){selected.removed=true;jadeChord();showToast('一环已解');}
 if(rings.every(r=>r.removed)){setTimeout(()=>{jadeChord(true);showToast('此结已解 · 玉响清和')},180)}
 gesture=null;selected=null;normalizeZ();draw()}
function rInner(r){return Math.max(34,r.r-r.thick-10)}
function hitRing(r,p){const d=Math.hypot(p.x-r.x,p.y-r.y);if(d<r.r+r.thick/2+18&&d>r.r-r.thick/2-30){const a=Math.atan2(p.y-r.y,p.x-r.x);return angDist(a,r.gap)>0.42}return d<rInner(r)}
function checkDetach(r,prev){for(const id of r.attach){if(isDetached(id,r.id))continue;const c=clasps.find(x=>x.id===id);const g=gapPoint(r);const near=Math.hypot(g.x-c.x,g.y-c.y)<74;const openingFacing=angDist(r.gap,Math.atan2(c.y-r.y,c.x-r.x))<0.56;const oldD=Math.hypot(prev.x-c.x,prev.y-c.y),newD=Math.hypot(r.x-c.x,r.y-c.y);if(near&&openingFacing&&newD>oldD+4){c.detached[r.id]=true;chime(.35);showToast('缺口穿过金扣');}}
}
function isDetached(id,rid){return clasps.find(c=>c.id===id).detached[rid]}
function outside(r){return r.x<-r.r*.5||r.x>900+r.r*.5||r.y<-r.r*.5||r.y>1120+r.r*.5}
function normalizeZ(){rings.sort((a,b)=>a.z-b.z).forEach((r,i)=>r.z=i)}
function gapPoint(r){return{x:r.x+Math.cos(r.gap)*r.r,y:r.y+Math.sin(r.gap)*r.r}}
function norm(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a}function angDist(a,b){return Math.abs(norm(a-b))}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

function draw(){const c=chapters[chapter];ctx.clearRect(0,0,900,1120);drawBg(c);rings.filter(r=>!r.removed).sort((a,b)=>a.z-b.z).forEach(r=>drawRing(r,c));clasps.forEach(ca=>drawClasp(ca));if(selected)drawSelection(selected)}
function drawBg(c){const g=ctx.createLinearGradient(0,0,0,1120);g.addColorStop(0,c.bg[0]);g.addColorStop(1,c.bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,900,1120);ctx.save();ctx.globalAlpha=.14;ctx.fillStyle='#d9c493';ctx.beginPath();ctx.arc(735,125,54,0,TAU);ctx.fill();ctx.globalAlpha=.11;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,640+i*65);ctx.bezierCurveTo(220,590+i*58,410,700+i*52,900,620+i*60);ctx.strokeStyle='#d6c8a7';ctx.lineWidth=2;ctx.stroke()}ctx.restore()}
function drawRing(r,c){const start=r.gap+.42,end=r.gap+TAU-.42;ctx.save();ctx.lineCap='round';ctx.shadowColor='rgba(0,0,0,.46)';ctx.shadowBlur=18;ctx.shadowOffsetY=10;ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.strokeStyle='#071a18';ctx.lineWidth=r.thick+13;ctx.stroke();ctx.shadowColor='transparent';const grad=ctx.createLinearGradient(r.x-r.r,r.y-r.r,r.x+r.r,r.y+r.r);grad.addColorStop(0,c.jade[2]);grad.addColorStop(.28,c.jade[0]);grad.addColorStop(.56,c.jade[1]);grad.addColorStop(.8,c.jade[0]);grad.addColorStop(1,c.jade[2]);ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.strokeStyle=grad;ctx.lineWidth=r.thick;ctx.stroke();ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(r.x-4,r.y-5,r.r-4,start,end);ctx.strokeStyle='rgba(255,255,255,.68)';ctx.lineWidth=8;ctx.stroke();ctx.globalAlpha=.24;ctx.setLineDash([20,38]);ctx.beginPath();ctx.arc(r.x,r.y,r.r,start+.12,end-.12);ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=4;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;drawEnd(r,start,c);drawEnd(r,end,c);ctx.restore()}
function drawEnd(r,a,c){const x=r.x+Math.cos(a)*r.r,y=r.y+Math.sin(a)*r.r;const eg=ctx.createRadialGradient(x-7,y-7,2,x,y,r.thick*.55);eg.addColorStop(0,'#fff');eg.addColorStop(.42,c.jade[0]);eg.addColorStop(1,c.jade[2]);ctx.fillStyle=eg;ctx.strokeStyle='rgba(12,45,40,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r.thick*.48,0,TAU);ctx.fill();ctx.stroke()}
function drawClasp(ca){const a=rings.find(r=>r.id===ca.a),b=rings.find(r=>r.id===ca.b);if(a.removed&&b.removed)return;ctx.save();ctx.translate(ca.x,ca.y);ctx.rotate(ca.rot);ctx.shadowColor='rgba(0,0,0,.42)';ctx.shadowBlur=11;ctx.shadowOffsetY=6;const g=ctx.createLinearGradient(-48,-30,48,30);g.addColorStop(0,'#7b4312');g.addColorStop(.18,'#ffe18a');g.addColorStop(.48,'#c47b1c');g.addColorStop(.72,'#fff0a1');g.addColorStop(1,'#79400e');roundRect(-49,-31,98,62,18);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#8c4d13';ctx.stroke();ctx.shadowColor='transparent';ctx.strokeStyle='rgba(255,246,191,.85)';ctx.lineWidth=3;roundRect(-40,-22,80,44,14);ctx.stroke();ctx.strokeStyle='#8b4b17';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-24,4);ctx.bezierCurveTo(-12,-22,3,-20,0,0);ctx.bezierCurveTo(-3,20,14,22,25,-5);ctx.stroke();ctx.restore()}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function drawSelection(r){ctx.save();ctx.strokeStyle='rgba(255,239,168,.85)';ctx.lineWidth=4;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(r.x,r.y,r.r+34,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore()}
function showToast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1300)}
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function tone(freq,delay,dur,gain,type='sine'){if(!soundOn)return;ensureAudio();const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.985,t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+dur)}
function chime(scale=1){tone(1820,0,.18,.065*scale);tone(2740,.012,.13,.035*scale,'triangle');tone(940,.018,.32,.028*scale)}
function jadeChord(win=false){chime(1);tone(win?1568:1320,.11,.45,.06);tone(win?2093:1760,.18,.62,.045,'triangle')}
reset();draw();
})();
