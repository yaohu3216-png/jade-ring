'use strict';
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const app=document.getElementById('app');
const stage=document.getElementById('stage');
const restartBtn=document.getElementById('restart');
const nextBtn=document.getElementById('next');
const soundBtn=document.getElementById('sound');
const musicBtn=document.getElementById('music');
const bgm=document.getElementById('bgm');
const levelName=document.getElementById('levelName');
const levelVerse=document.getElementById('levelVerse');
const hint=document.getElementById('hint');

let W=0,H=0,S=0,DPR=Math.min(window.devicePixelRatio||1,2);
let levelIndex=0,rings=[],clasps=[],particles=[];
let selected=null,lastAngle=0,soundOn=true,musicWanted=true,musicPlaying=false,audioCtx=null;

const THEMES={
 pink:{page:['#f7ecec','#dcbfc7'],ink:'#56343e',muted:'rgba(86,52,62,.67)',line:'rgba(104,61,74,.24)',panel:'rgba(255,250,248,.56)',sky:['#f8e9e7','#e8cfd1','#cfaeb9'],ring:['#fff4f5','#f4b6c7','#d8799b','#a94f72'],accent:'#a94f72',petal:'rgba(198,102,133,.50)'},
 purple:{page:['#eee9f5','#cfc1df'],ink:'#463754',muted:'rgba(70,55,84,.68)',line:'rgba(75,55,96,.23)',panel:'rgba(250,248,255,.54)',sky:['#eee7f5','#d6c8e4','#afa0ca'],ring:['#fbf7ff','#d7bee8','#9a70bc','#60417f'],accent:'#654582',petal:'rgba(124,92,159,.46)'},
 green:{page:['#e7efe7','#b8cec0'],ink:'#244a3a',muted:'rgba(36,74,58,.68)',line:'rgba(38,80,59,.22)',panel:'rgba(247,252,246,.52)',sky:['#e7efe5','#c8ddce','#8fb7a0'],ring:['#effff3','#83c99a','#23835a','#075338'],accent:'#176846',petal:'rgba(47,126,83,.43)'},
 white:{page:['#f5f2e9','#d9d7cb'],ink:'#4f4c43',muted:'rgba(79,76,67,.66)',line:'rgba(88,84,72,.22)',panel:'rgba(255,254,247,.58)',sky:['#f6f3ea','#e5e2d7','#c6cbc4'],ring:['#ffffff','#e8f0ec','#bdd1cd','#829f9b'],accent:'#708f8b',petal:'rgba(128,151,145,.42)'}
};

// x 以画布宽度计；y、r 以画布短边 S 计，使手机竖屏上的玉环保持紧凑相扣。
const LEVELS=[
 {name:'第一关 · 桃粉玉',verse:'桃夭映月，玉结迎祥',theme:'pink',
  rings:[
   {id:'A',x:.50,y:.24,r:.115,a:2.20},
   {id:'B',x:.36,y:.45,r:.118,a:.45},
   {id:'C',x:.64,y:.45,r:.118,a:3.55},
   {id:'D',x:.50,y:.67,r:.122,a:5.10}],
  clasps:[['A','B'],['A','C'],['B','D'],['C','D']]},
 {name:'第二关 · 紫苑玉',verse:'紫气凝香，心结渐解',theme:'purple',
  rings:[
   {id:'A',x:.50,y:.18,r:.098,a:1.9},{id:'B',x:.34,y:.36,r:.105,a:.3},
   {id:'C',x:.50,y:.39,r:.112,a:4.5},{id:'D',x:.66,y:.36,r:.105,a:3.1},
   {id:'E',x:.39,y:.60,r:.108,a:5.4},{id:'F',x:.61,y:.60,r:.108,a:1.2},
   {id:'G',x:.50,y:.78,r:.096,a:4.8}],
  clasps:[['A','B'],['A','C'],['A','D'],['B','E'],['C','E'],['C','F'],['D','F'],['E','G'],['F','G']]},
 {name:'第三关 · 帝王绿',verse:'翠色生辉，福运相随',theme:'green',
  rings:[
   {id:'A',x:.37,y:.22,r:.108,a:2.6},{id:'B',x:.63,y:.22,r:.108,a:.5},
   {id:'C',x:.27,y:.43,r:.106,a:4.7},{id:'D',x:.50,y:.44,r:.123,a:1.1},
   {id:'E',x:.73,y:.43,r:.106,a:3.5},{id:'F',x:.39,y:.66,r:.110,a:5.5},
   {id:'G',x:.61,y:.66,r:.110,a:2.0}],
  clasps:[['A','C'],['A','D'],['B','D'],['B','E'],['C','F'],['D','F'],['D','G'],['E','G']]},
 {name:'第四关 · 羊脂白玉',verse:'月白无瑕，百事安和',theme:'white',
  rings:[
   {id:'A',x:.50,y:.16,r:.095,a:2.8},{id:'B',x:.35,y:.33,r:.100,a:.5},
   {id:'C',x:.65,y:.33,r:.100,a:4.2},{id:'D',x:.27,y:.54,r:.105,a:1.2},
   {id:'E',x:.50,y:.51,r:.120,a:5.0},{id:'F',x:.73,y:.54,r:.105,a:2.5},
   {id:'G',x:.39,y:.73,r:.100,a:3.8},{id:'H',x:.61,y:.73,r:.100,a:.9}],
  clasps:[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['E','H'],['F','H']]}
];

function resize(){
 const r=canvas.getBoundingClientRect();W=r.width;H=r.height;S=Math.min(W,H);
 canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
 ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize',resize);

function setTheme(t){
 document.documentElement.style.setProperty('--page1',t.page[0]);
 document.documentElement.style.setProperty('--page2',t.page[1]);
 document.documentElement.style.setProperty('--ink',t.ink);
 document.documentElement.style.setProperty('--muted',t.muted);
 document.documentElement.style.setProperty('--line',t.line);
 document.documentElement.style.setProperty('--panel',t.panel);
 document.querySelector('meta[name="theme-color"]').setAttribute('content',t.page[1]);
}
function loadLevel(i){
 levelIndex=(i+LEVELS.length)%LEVELS.length;
 const L=LEVELS[levelIndex],t=THEMES[L.theme];setTheme(t);
 levelName.textContent=L.name;levelVerse.textContent=L.verse;
 rings=L.rings.map(r=>({...r,angle:r.a,velocity:0,fall:0,alpha:1,removed:false}));
 clasps=L.clasps.map((c,n)=>({id:n,a:c[0],b:c[1],open:false,flash:0}));
 selected=null;particles=[];nextBtn.classList.add('hidden');
 hint.textContent='转动玉环，让缺口穿过金扣';
}
function ring(id){return rings.find(r=>r.id===id)}
function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function center(r){return{x:r.x*W,y:H*.11+r.y*S+r.fall}}
function radius(r){return r.r*S}
function pointerPos(e){const b=canvas.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}}
function pick(p){
 let best=null,score=Infinity;
 for(const r of rings){
  if(r.removed||r.alpha<.15)continue;
  const c=center(r),rr=radius(r),d=Math.hypot(p.x-c.x,p.y-c.y);
  if(d<rr*.58||d>rr*1.42)continue;
  const s=Math.abs(d-rr);if(s<score){score=s;best=r}
 }
 return best;
}
function ensureMusic(){if(musicWanted&&!musicPlaying)startMusic()}
function down(e){
 e.preventDefault();ensureMusic();selected=pick(pointerPos(e));if(!selected)return;
 selected.velocity=0;const p=pointerPos(e),c=center(selected);lastAngle=Math.atan2(p.y-c.y,p.x-c.x);
 try{canvas.setPointerCapture(e.pointerId)}catch(_){ }
}
function move(e){
 if(!selected)return;e.preventDefault();
 const p=pointerPos(e),c=center(selected),a=Math.atan2(p.y-c.y,p.x-c.x),d=norm(a-lastAngle);
 selected.angle+=d;selected.velocity=d;lastAngle=a;testClasps(selected.id);
}
function up(e){
 if(selected){testClasps(selected.id);selected=null}
 try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(_){ }
}
canvas.addEventListener('pointerdown',down,{passive:false});
canvas.addEventListener('pointermove',move,{passive:false});
canvas.addEventListener('pointerup',up,{passive:false});
canvas.addEventListener('pointercancel',up,{passive:false});

function direction(A,B){const a=center(A),b=center(B);return Math.atan2(b.y-a.y,b.x-a.x)}
function gapAligned(r,dir){return Math.abs(norm(r.angle-dir))<.27}
function testClasps(id){
 for(const c of clasps){
  if(c.open||!(c.a===id||c.b===id))continue;
  const A=ring(c.a),B=ring(c.b);if(!A||!B||A.removed||B.removed)continue;
  const ab=direction(A,B),ba=norm(ab+Math.PI);
  // 任意一侧的缺口穿过它所套住的金扣即可松开，避免双环必须同刻对准造成卡死。
  if((c.a===id&&gapAligned(A,ab))||(c.b===id&&gapAligned(B,ba))){
   c.open=true;c.flash=1;ring(id).velocity=0;
   const g=claspGeometry(c);playUnlock();spawnSpark(g.mx,g.my,false);
  }
 }
 updateRemoval();
}
function updateRemoval(){
 for(const r of rings){
  if(r.removed)continue;
  const locked=clasps.some(c=>!c.open&&(c.a===r.id||c.b===r.id));
  if(!locked){r.removed=true;r.velocity=0;setTimeout(playDrop,70)}
 }
 if(clasps.every(c=>c.open)){
  hint.textContent=levelIndex===LEVELS.length-1?'诸结皆解，玉环圆满':'此结已解，福运已开';
  nextBtn.textContent=levelIndex===LEVELS.length-1?'再游一轮':'下一关';
  nextBtn.classList.remove('hidden');for(let i=0;i<36;i++)spawnSpark(W/2,H*.47,true);
 }else if(clasps.some(c=>c.open)) hint.textContent='金扣已松，继续解开余结';
}

function audio(){
 if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;
}
function chime(freq,delay,gain,dur){
 if(!soundOn)return;const ac=audio(),now=ac.currentTime+delay;
 const osc=ac.createOscillator(),amp=ac.createGain(),filter=ac.createBiquadFilter();
 osc.type='sine';osc.frequency.setValueAtTime(freq,now);filter.type='highpass';filter.frequency.value=580;
 amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(gain,now+.008);amp.gain.exponentialRampToValueAtTime(.0001,now+dur);
 osc.connect(filter);filter.connect(amp);amp.connect(ac.destination);osc.start(now);osc.stop(now+dur+.04);
}
function playUnlock(){chime(1174.66,0,.032,.55);chime(1760,.035,.020,.42);chime(2349.32,.075,.011,.28)}
function playDrop(){chime(783.99,0,.016,.26)}
async function startMusic(){
 try{bgm.volume=.34;await bgm.play();musicPlaying=true;musicWanted=true;musicBtn.textContent='音乐：开'}
 catch(_){musicPlaying=false;musicBtn.textContent='音乐：待触发'}
}
function stopMusic(){bgm.pause();musicPlaying=false;musicWanted=false;musicBtn.textContent='音乐：关'}

function spawnSpark(x,y,burst){
 const t=THEMES[LEVELS[levelIndex].theme],n=burst?1:10;
 for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*(burst?4:2),vy:-.5-Math.random()*(burst?3:1.5),life:1,s:2+Math.random()*4,color:t.petal});
}

function drawBackground(){
 const t=THEMES[LEVELS[levelIndex].theme],time=performance.now()/1000;
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,t.sky[0]);sky.addColorStop(.48,t.sky[1]);sky.addColorStop(1,t.sky[2]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // 宣纸颗粒
 ctx.save();ctx.globalAlpha=.055;ctx.fillStyle=t.ink;
 for(let i=0;i<170;i++){const x=(i*73%997)/997*W,y=(i*151%991)/991*H;ctx.fillRect(x,y,Math.random()*1.4+.3,Math.random()*1.2+.3)}ctx.restore();
 // 月晕
 const moonX=W*.79,moonY=H*.14,moonR=S*.052;
 const halo=ctx.createRadialGradient(moonX,moonY,2,moonX,moonY,S*.23);halo.addColorStop(0,'rgba(255,248,218,.58)');halo.addColorStop(.2,'rgba(255,245,211,.18)');halo.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,W,H*.42);
 ctx.save();ctx.fillStyle='rgba(255,244,207,.76)';ctx.shadowColor='rgba(255,239,191,.42)';ctx.shadowBlur=26;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,Math.PI*2);ctx.fill();ctx.restore();
 // 山水层次
 ctx.save();ctx.fillStyle=t.accent;ctx.globalAlpha=.10;ctx.beginPath();ctx.moveTo(0,H*.31);ctx.bezierCurveTo(W*.16,H*.22,W*.27,H*.34,W*.42,H*.25);ctx.bezierCurveTo(W*.57,H*.17,W*.70,H*.34,W*.83,H*.25);ctx.bezierCurveTo(W*.92,H*.20,W,H*.29,W,H*.29);ctx.lineTo(W,H*.45);ctx.lineTo(0,H*.45);ctx.closePath();ctx.fill();ctx.restore();
 ctx.save();ctx.strokeStyle=t.accent;ctx.globalAlpha=.10;ctx.lineWidth=1;
 for(let i=0;i<9;i++){const y=H*(.30+i*.073);ctx.beginPath();ctx.moveTo(-20,y);ctx.bezierCurveTo(W*.25,y-5+Math.sin(time*.4+i)*2,W*.68,y+7,W+20,y);ctx.stroke()}ctx.restore();
 // 每关专属装饰
 ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle=t.accent;ctx.fillStyle=t.accent;
 if(LEVELS[levelIndex].theme==='pink'){
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.10,H);ctx.quadraticCurveTo(W*.14,H*.80,W*.27,H*.72);ctx.stroke();
  for(let i=0;i<6;i++){const x=W*(.20+i*.025),y=H*(.78-i*.025);ctx.beginPath();ctx.ellipse(x,y,9,5,i*.5,0,Math.PI*2);ctx.fill()}
 }else if(LEVELS[levelIndex].theme==='purple'){
  for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(W*(.08+i*.17),H*(.78+Math.sin(i)*.04),S*(.05+i%2*.02),0,Math.PI*2);ctx.stroke()}
 }else if(LEVELS[levelIndex].theme==='green'){
  ctx.lineWidth=3;for(let i=0;i<4;i++){const x=W*(.13+i*.23);ctx.beginPath();ctx.moveTo(x,H);ctx.quadraticCurveTo(x+12,H*.78,x+5,H*.61);ctx.stroke();for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+(j%2?15:-12),H*(.83-j*.06),16,5,j%2?.5:-.5,0,Math.PI*2);ctx.fill()}}
 }else{
  ctx.lineWidth=1;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(W*.16+i*W*.18,H*.82,S*(.035+i%2*.012),0,Math.PI*2);ctx.stroke()}
 }
 ctx.restore();
 // 薄雾
 const fog=ctx.createLinearGradient(0,H*.43,W,H*.58);fog.addColorStop(0,'rgba(255,255,255,0)');fog.addColorStop(.5,'rgba(255,255,255,.14)');fog.addColorStop(1,'rgba(255,255,255,0)');ctx.save();ctx.translate(Math.sin(time*.18)*18,0);ctx.fillStyle=fog;ctx.fillRect(-30,H*.40,W+60,H*.20);ctx.restore();
}

function jadeGradient(rr){
 const t=THEMES[LEVELS[levelIndex].theme],g=ctx.createLinearGradient(-rr,-rr,rr,rr);
 g.addColorStop(0,t.ring[0]);g.addColorStop(.23,t.ring[1]);g.addColorStop(.52,t.ring[2]);g.addColorStop(.72,t.ring[3]);g.addColorStop(.88,t.ring[1]);g.addColorStop(1,t.ring[0]);return g;
}
function drawRing(r){
 const rr=radius(r),c=center(r),gap=.82,w=rr*.30,time=performance.now()/1000;
 ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(c.x,c.y);ctx.lineCap='round';
 ctx.shadowColor='rgba(61,38,48,.18)';ctx.shadowBlur=13;ctx.shadowOffsetY=7;ctx.strokeStyle=jadeGradient(rr);ctx.lineWidth=w;ctx.beginPath();ctx.arc(0,0,rr,r.angle+gap/2,r.angle+Math.PI*2-gap/2);ctx.stroke();
 // 玉石内层柔光
 ctx.shadowColor='transparent';ctx.globalAlpha=r.alpha*.30;ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=w*.52;ctx.beginPath();ctx.arc(0,0,rr,r.angle+gap/2+.05,r.angle+Math.PI*2-gap/2-.05);ctx.stroke();
 // 流动高光
 ctx.globalAlpha=r.alpha*.72;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=w*.10;const shine=.65+Math.sin(time*.7+r.id.charCodeAt(0))*.35;ctx.beginPath();ctx.arc(-rr*.035,-rr*.05,rr,r.angle+gap/2+.20,r.angle+gap/2+.20+1.15*shine);ctx.stroke();
 // 云絮玉纹
 ctx.globalAlpha=r.alpha*.15;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.3;
 for(let i=0;i<6;i++){const a=r.angle+.65+i*.82;ctx.beginPath();ctx.arc(0,0,rr+(i%2?2:-2),a,a+.18+Math.sin(i)*.05);ctx.stroke()}
 ctx.restore();
}

function claspGeometry(c){
 const A=ring(c.a),B=ring(c.b),ca=center(A),cb=center(B),ang=Math.atan2(cb.y-ca.y,cb.x-ca.x),ra=radius(A),rb=radius(B);
 const ax=ca.x+Math.cos(ang)*ra,ay=ca.y+Math.sin(ang)*ra;
 const bx=cb.x-Math.cos(ang)*rb,by=cb.y-Math.sin(ang)*rb;
 return{A,B,ang,ax,ay,bx,by,mx:(ax+bx)/2,my:(ay+by)/2,ta:ra*.30,tb:rb*.30};
}
function roundedRect(x,y,w,h,r){
 const q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath();
}
function goldGradient(w){const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#6d3e0c');g.addColorStop(.18,'#ad6e1f');g.addColorStop(.44,'#ffe29a');g.addColorStop(.62,'#d39a3d');g.addColorStop(1,'#70410d');return g}
function drawSleeve(x,y,tube,radialAngle,front){
 // 套筒横跨玉管，后半层在玉管后、前半层在玉管前，形成真正包裹关系。
 const tangential=radialAngle+Math.PI/2,w=tube*.92,h=tube*1.34;
 ctx.save();ctx.translate(x,y);ctx.rotate(tangential);
 if(!front){
  ctx.globalAlpha=.86;ctx.fillStyle='#70420f';ctx.shadowColor='rgba(45,24,7,.28)';ctx.shadowBlur=5;ctx.shadowOffsetY=3;roundedRect(-w/2,-h/2,w,h,h*.28);ctx.fill();
 }else{
  ctx.fillStyle=goldGradient(w);ctx.shadowColor='rgba(48,25,7,.24)';ctx.shadowBlur=4;ctx.shadowOffsetY=2;roundedRect(-w/2,-h*.35,w,h*.70,h*.23);ctx.fill();
  ctx.shadowColor='transparent';ctx.fillStyle='rgba(255,241,184,.78)';roundedRect(-w*.29,-h*.28,w*.11,h*.56,h*.07);ctx.fill();
  ctx.strokeStyle='rgba(92,51,10,.50)';ctx.lineWidth=1;roundedRect(-w/2,-h*.35,w,h*.70,h*.23);ctx.stroke();
  // 两侧箍边让它更像短金属套筒，而非贴片。
  ctx.strokeStyle='rgba(255,224,143,.64)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-w*.42,-h*.30);ctx.lineTo(-w*.42,h*.30);ctx.moveTo(w*.42,-h*.30);ctx.lineTo(w*.42,h*.30);ctx.stroke();
 }
 ctx.restore();
}
function drawClaspLayer(front){
 for(const c of clasps){
  if(c.open)continue;const g=claspGeometry(c);if(g.A.removed||g.B.removed)continue;
  drawSleeve(g.ax,g.ay,g.ta,g.ang,front);drawSleeve(g.bx,g.by,g.tb,g.ang+Math.PI,front);
 }
}
function update(){
 for(const r of rings){if(!r.removed&&r!==selected){r.angle+=r.velocity;r.velocity*=.88}if(r.removed){r.fall+=1.55;r.alpha*=.963}}
 for(const c of clasps)c.flash*=.90;
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life*=.96}particles=particles.filter(p=>p.life>.04);
}
function drawParticles(){for(const p of particles){ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.x*.02);ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.7,0,0,Math.PI*2);ctx.fill();ctx.restore()}}
function frame(){ctx.clearRect(0,0,W,H);drawBackground();drawClaspLayer(false);rings.forEach(drawRing);drawClaspLayer(true);drawParticles();update();requestAnimationFrame(frame)}

restartBtn.addEventListener('click',()=>loadLevel(levelIndex));
nextBtn.addEventListener('click',()=>loadLevel(levelIndex+1));
soundBtn.addEventListener('click',()=>{soundOn=!soundOn;soundBtn.textContent='叮当：'+(soundOn?'开':'关');if(soundOn)playUnlock()});
musicBtn.addEventListener('click',()=>{if(musicWanted||musicPlaying)stopMusic();else startMusic()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&musicPlaying)bgm.pause();else if(!document.hidden&&musicWanted)startMusic()});

resize();loadLevel(0);frame();
