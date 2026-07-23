(() => {
'use strict';
const TAU=Math.PI*2;
const chapters=[
 {name:'青玉章',jade:['#effff9','#9edbc8','#4e9d84'],bg:['#153e38','#0b2925'],quote:'君子比德于玉，温润而泽。'},
 {name:'羊脂白玉',jade:['#fffef4','#f1e7ca','#cdbb94'],bg:['#8a7869','#3f352f'],quote:'皎若凝脂，静若初雪。'},
 {name:'碧玉章',jade:['#dcf5d4','#75bd7b','#2d7044'],bg:['#47684e','#172f25'],quote:'碧色含春，清光入怀。'},
 {name:'翡翠章',jade:['#e6ffea','#68d996','#0d8055'],bg:['#155946','#092f29'],quote:'翠色盈袖，生意自来。'},
 {name:'黄玉章',jade:['#fff1ae','#e0b85b','#93601f'],bg:['#735a3a','#30251c'],quote:'温金含光，厚德载物。'},
 {name:'紫玉章',jade:['#f7e8ff','#c293e8','#76509b'],bg:['#665371','#261d31'],quote:'烟霞入佩，紫气凝华。'},
 {name:'墨玉章',jade:['#d5dfdc','#556864','#182220'],bg:['#535b58','#111716'],quote:'墨中有润，静里藏光。'},
 {name:'赤玉章',jade:['#ffe0d8','#dc7d6c','#84362f'],bg:['#75504b','#2c1b1b'],quote:'丹心照玉，赤诚如初。'}
];
const gallery=document.querySelector('#gallery'),gameScreen=document.querySelector('#gameScreen'),grid=document.querySelector('#chapterGrid');
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const movesEl=document.querySelector('#moves'),chapterName=document.querySelector('#chapterName'),quoteEl=document.querySelector('#quote');
let soundOn=true,audioCtx=null,chapter=0,moves=0,selected=null,gesture=null,toastTimer=0;
let rings=[],clasps=[],particles=[];

chapters.forEach((c,i)=>{const card=document.createElement('article');card.className='chapter-card';card.style.setProperty('--c1',c.bg[0]);card.style.setProperty('--c2',c.bg[1]);card.style.setProperty('--jade',c.jade[1]);card.innerHTML=`<h3>${c.name}</h3><p>${c.quote}</p><span class="badge">第一关 · 免费试玩</span><i class="sample-ring"></i>`;card.onclick=()=>startChapter(i);grid.appendChild(card)});
document.querySelector('#backBtn').onclick=()=>{gameScreen.classList.remove('active');gallery.classList.add('active')};
document.querySelector('#resetBtn').onclick=reset;
document.querySelector('#hintBtn').onclick=()=>{const r=rings.find(x=>!x.removed&&canAttempt(x));showToast(r?`先解${r.id}环：把缺口滑过金扣。`:'先移动最外层、只受一处金扣牵制的玉环。')};
document.querySelector('#soundBtn').onclick=()=>{soundOn=!soundOn;document.querySelector('#soundBtn').textContent=soundOn?'音':'静'};

function startChapter(i){chapter=i;gallery.classList.remove('active');gameScreen.classList.add('active');chapterName.textContent=chapters[i].name;quoteEl.textContent=chapters[i].quote;reset();requestAnimationFrame(fit)}
function reset(){moves=0;movesEl.textContent='0';selected=null;gesture=null;particles=[];buildLevel();draw()}
function buildLevel(){
 rings=[
  ring('A',450,220,124,-Math.PI/2,5),
  ring('B',260,410,122,Math.PI,4),ring('C',640,410,122,0,3),
  ring('D',315,665,120,Math.PI*.78,2),ring('E',585,665,120,Math.PI*.22,1),
  ring('F',450,880,120,Math.PI/2,0)
 ];
 // host = 金扣真正套住并跟随的玉环；guest = 需要把缺口穿过此扣才能脱离的玉环。
 clasps=[
  clasp('ab','A','B', 2.35), clasp('ac','A','C', .79),
  clasp('bc','B','C', 0),
  clasp('bd','B','D', 1.05), clasp('ce','C','E', 2.09),
  clasp('de','D','E', 0), clasp('df','D','F', .83), clasp('ef','E','F', 2.31)
 ];
 rings.forEach(r=>r.attach=clasps.filter(c=>c.guest===r.id).map(c=>c.id));
}
function ring(id,x,y,r,gap,z){return{id,x,y,r,thick:48,gap,removed:false,removing:false,alpha:1,scale:1,attach:[],z}}
function clasp(id,host,guest,hostAngle){return{id,host,guest,hostAngle,detached:false,flash:0}}
function claspPose(c){const h=rings.find(r=>r.id===c.host);return{x:h.x+Math.cos(h.gap+c.hostAngle)*h.r,y:h.y+Math.sin(h.gap+c.hostAngle)*h.r,rot:h.gap+c.hostAngle+Math.PI/2}}
function fit(){draw()}
addEventListener('resize',()=>requestAnimationFrame(fit));
function pos(ev){const rect=canvas.getBoundingClientRect();return{x:(ev.clientX-rect.left)*900/rect.width,y:(ev.clientY-rect.top)*1120/rect.height}}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
function down(e){canvas.setPointerCapture(e.pointerId);ensureAudio();const p=pos(e);const hit=[...rings].filter(r=>!r.removed&&!r.removing).sort((a,b)=>b.z-a.z).find(r=>hitRing(r,p));if(!hit)return;selected=hit;const d=Math.hypot(p.x-hit.x,p.y-hit.y);gesture={id:e.pointerId,mode:d<rInner(hit)?'move':'rotate',sx:p.x,sy:p.y,ox:hit.x,oy:hit.y,og:hit.gap,lastAng:Math.atan2(p.y-hit.y,p.x-hit.x)};hit.z=99;draw()}
function move(e){if(!gesture||e.pointerId!==gesture.id||!selected)return;const p=pos(e);if(gesture.mode==='rotate'){const a=Math.atan2(p.y-selected.y,p.x-selected.x);selected.gap=norm(gesture.og+(a-gesture.lastAng));checkDetach(selected,{x:selected.x,y:selected.y});}
 else{const prev={x:selected.x,y:selected.y};selected.x=clamp(gesture.ox+(p.x-gesture.sx),-80,980);selected.y=clamp(gesture.oy+(p.y-gesture.sy),-80,1200);checkDetach(selected,prev)}
 draw()}
function up(e){if(!gesture||e.pointerId!==gesture.id)return;moves++;movesEl.textContent=moves;softTick();gesture=null;selected=null;normalizeZ();draw()}
function rInner(r){return Math.max(42,r.r-r.thick-12)}
function hitRing(r,p){const d=Math.hypot(p.x-r.x,p.y-r.y);if(d<r.r+r.thick/2+24&&d>r.r-r.thick/2-34){const a=Math.atan2(p.y-r.y,p.x-r.x);return angDist(a,r.gap)>.46}return d<rInner(r)}
function canAttempt(r){return r.attach.filter(id=>!clasps.find(c=>c.id===id).detached).length<=1}
function checkDetach(r,prev){
 if(r.removed||r.removing)return;
 for(const id of r.attach){
  const c=clasps.find(x=>x.id===id);if(c.detached)continue;
  // 其它仍未解开的扣会形成牵制，模拟视频中“先解外层，再露出内层”。
  const remaining=r.attach.filter(cid=>!clasps.find(q=>q.id===cid).detached);
  if(remaining.length>1)continue;
  const cp=claspPose(c),g1=gapEndPoints(r),d1=Math.min(dist(g1.a,cp),dist(g1.b,cp));
  const facing=angDist(r.gap,Math.atan2(cp.y-r.y,cp.x-r.x))<.72;
  const oldD=Math.hypot(prev.x-cp.x,prev.y-cp.y),newD=Math.hypot(r.x-cp.x,r.y-cp.y);
  if(d1<68&&facing&&newD>oldD+2){
   c.detached=true;c.flash=1;diamondChime();spawnSpark(cp.x,cp.y);showToast('玉环已滑出金扣');
   if(r.attach.every(cid=>clasps.find(q=>q.id===cid).detached))autoRemove(r);
  }
 }
}
function autoRemove(r){
 if(r.removing||r.removed)return;r.removing=true;jadeRelease();
 const started=performance.now();const startScale=r.scale;
 function step(now){const t=Math.min(1,(now-started)/420);r.alpha=1-t;r.scale=startScale*(1+.12*t);draw();if(t<1)requestAnimationFrame(step);else{r.removed=true;r.removing=false;r.alpha=0;showToast('一环已解');if(rings.every(x=>x.removed)){setTimeout(()=>{victoryChime();showToast('此结已解 · 玉响清和')},250)}draw()}}
 requestAnimationFrame(step)
}
function normalizeZ(){rings.filter(r=>!r.removed).sort((a,b)=>a.z-b.z).forEach((r,i)=>r.z=i)}
function gapEndPoints(r){const a=r.gap-.46,b=r.gap+.46;return{a:{x:r.x+Math.cos(a)*r.r,y:r.y+Math.sin(a)*r.r},b:{x:r.x+Math.cos(b)*r.r,y:r.y+Math.sin(b)*r.r}}}
function norm(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a}
function angDist(a,b){return Math.abs(norm(a-b))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function spawnSpark(x,y){for(let i=0;i<8;i++)particles.push({x,y,vx:(Math.random()-.5)*2.4,vy:(Math.random()-.5)*2.4-1,life:1})}

function draw(){const c=chapters[chapter];ctx.clearRect(0,0,900,1120);drawBg(c);
 rings.filter(r=>!r.removed).sort((a,b)=>a.z-b.z).forEach(r=>drawRing(r,c));
 clasps.forEach(drawClasp);
 if(selected)drawSelection(selected);
 drawParticles();
}
function drawBg(c){const g=ctx.createLinearGradient(0,0,0,1120);g.addColorStop(0,c.bg[0]);g.addColorStop(1,c.bg[1]);ctx.fillStyle=g;ctx.fillRect(0,0,900,1120);ctx.save();ctx.globalAlpha=.11;ctx.fillStyle='#e2cf9f';ctx.beginPath();ctx.arc(735,125,54,0,TAU);ctx.fill();ctx.globalAlpha=.08;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,650+i*62);ctx.bezierCurveTo(220,600+i*58,430,710+i*50,900,625+i*60);ctx.strokeStyle='#eadfbd';ctx.lineWidth=2;ctx.stroke()}ctx.restore()}
function drawRing(r,c){const start=r.gap+.46,end=r.gap+TAU-.46;ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(r.x,r.y);ctx.scale(r.scale,r.scale);ctx.translate(-r.x,-r.y);ctx.lineCap='round';
 ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=20;ctx.shadowOffsetY=10;ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.strokeStyle='rgba(5,20,18,.82)';ctx.lineWidth=r.thick+14;ctx.stroke();ctx.shadowColor='transparent';
 const grad=ctx.createLinearGradient(r.x-r.r,r.y-r.r,r.x+r.r,r.y+r.r);grad.addColorStop(0,c.jade[2]);grad.addColorStop(.18,c.jade[1]);grad.addColorStop(.38,c.jade[0]);grad.addColorStop(.58,c.jade[1]);grad.addColorStop(.78,c.jade[0]);grad.addColorStop(1,c.jade[2]);ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.strokeStyle=grad;ctx.lineWidth=r.thick;ctx.stroke();
 // 玉肉内部的温润雾层
 ctx.globalAlpha=.32;ctx.beginPath();ctx.arc(r.x,r.y,r.r-2,start,end);ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=r.thick*.36;ctx.stroke();
 ctx.globalAlpha=.74;ctx.beginPath();ctx.arc(r.x-5,r.y-7,r.r-5,start+.05,end-.05);ctx.strokeStyle='rgba(255,255,255,.68)';ctx.lineWidth=8;ctx.stroke();
 ctx.globalAlpha=.16;ctx.setLineDash([16,34]);ctx.beginPath();ctx.arc(r.x,r.y,r.r,start+.15,end-.15);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=5;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 drawEnd(r,start,c);drawEnd(r,end,c);ctx.restore()}
function drawEnd(r,a,c){const x=r.x+Math.cos(a)*r.r,y=r.y+Math.sin(a)*r.r;const eg=ctx.createRadialGradient(x-8,y-9,2,x,y,r.thick*.58);eg.addColorStop(0,'#fff');eg.addColorStop(.38,c.jade[0]);eg.addColorStop(.72,c.jade[1]);eg.addColorStop(1,c.jade[2]);ctx.fillStyle=eg;ctx.strokeStyle='rgba(20,52,46,.38)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r.thick*.49,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.64)';ctx.beginPath();ctx.ellipse(x-7,y-8,7,4,-.5,0,TAU);ctx.fill()}
function drawClasp(c){const h=rings.find(r=>r.id===c.host),gRing=rings.find(r=>r.id===c.guest);if(!h||h.removed)return;const p=claspPose(c);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=h.alpha;
 // 扣的背片先画在玉环下，形成真正“套住”的感觉
 ctx.shadowColor='rgba(0,0,0,.36)';ctx.shadowBlur=10;ctx.shadowOffsetY=5;const grd=ctx.createLinearGradient(-42,-22,42,22);grd.addColorStop(0,'#9d5c18');grd.addColorStop(.18,'#f6c758');grd.addColorStop(.48,'#ffe79b');grd.addColorStop(.72,'#d49227');grd.addColorStop(1,'#7a400e');roundRect(-44,-25,88,50,15);ctx.fillStyle=grd;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#8a4c12';ctx.stroke();
 // 光滑金面，不再使用纹样
 ctx.shadowColor='transparent';const hi=ctx.createLinearGradient(0,-20,0,20);hi.addColorStop(0,'rgba(255,255,255,.7)');hi.addColorStop(.35,'rgba(255,255,255,.12)');hi.addColorStop(1,'rgba(90,45,4,.15)');roundRect(-37,-18,74,36,11);ctx.fillStyle=hi;ctx.fill();
 // 中央细腰让扣像金镶玉套箍
 ctx.fillStyle='rgba(150,78,12,.32)';ctx.fillRect(-3,-23,6,46);
 // 小圆钻点缀，仅少量
 drawDiamond(-20,0,5);drawDiamond(20,0,5);
 if(c.flash>0){ctx.globalAlpha=c.flash;ctx.strokeStyle='rgba(255,255,220,.95)';ctx.lineWidth=5;roundRect(-49,-30,98,60,18);ctx.stroke();c.flash=Math.max(0,c.flash-.12);requestAnimationFrame(draw)}
 ctx.restore()}
function drawDiamond(x,y,r){const dg=ctx.createRadialGradient(x-2,y-2,1,x,y,r);dg.addColorStop(0,'#fff');dg.addColorStop(.35,'#f9fbff');dg.addColorStop(.7,'#c7e7ff');dg.addColorStop(1,'#7aa7c6');ctx.fillStyle=dg;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.stroke()}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function drawSelection(r){ctx.save();ctx.strokeStyle='rgba(255,239,168,.72)';ctx.lineWidth=3;ctx.setLineDash([12,10]);ctx.beginPath();ctx.arc(r.x,r.y,r.r+36,0,TAU);ctx.stroke();ctx.restore()}
function drawParticles(){if(!particles.length)return;ctx.save();for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.04;p.life-=.04;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle='#fff3b4';ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,TAU);ctx.fill()}ctx.restore();particles=particles.filter(p=>p.life>0);if(particles.length)requestAnimationFrame(draw)}
function showToast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1300)}
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function tone(freq,delay,dur,gain,type='sine'){if(!soundOn)return;ensureAudio();const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(freq*.99,t+dur);f.type='bandpass';f.frequency.value=freq;f.Q.value=8;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(f).connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+dur)}
function softTick(){tone(1300,0,.08,.018,'triangle')}
function diamondChime(){tone(2100,0,.19,.045);tone(3150,.014,.12,.022,'triangle');tone(1120,.025,.30,.024)}
function jadeRelease(){tone(1760,0,.24,.06);tone(2349,.07,.38,.045,'triangle');tone(1175,.11,.46,.032);tone(3136,.13,.22,.02,'sine')}
function victoryChime(){tone(1318,0,.42,.055);tone(1760,.11,.52,.045);tone(2093,.22,.65,.038,'triangle')}
reset();draw();
})();
