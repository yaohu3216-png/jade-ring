const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const stage=document.getElementById('stage');
const restartBtn=document.getElementById('restart');
const nextBtn=document.getElementById('next');
const soundBtn=document.getElementById('sound');
const musicBtn=document.getElementById('music');
const bgm=document.getElementById('bgm');
const levelName=document.getElementById('levelName');
const hint=document.getElementById('hint');

let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
let levelIndex=0,rings=[],clasps=[],particles=[];
let selected=null,lastAngle=0,soundOn=true,musicOn=false,audioCtx=null;

const THEMES={
  pink:{bg:['#fff8fb','#f4dfe8','#e7c3d2'],ring:['#fff5f8','#f2a8c1','#c75f89'],accent:'#b95e82',particle:'rgba(225,122,160,.55)'},
  purple:{bg:['#fffaff','#eee1f7','#d8c2e8'],ring:['#fff6ff','#c59cde','#744895'],accent:'#7d4e9e',particle:'rgba(150,102,190,.50)'},
  green:{bg:['#f8fff9','#dfefe2','#bad8c2'],ring:['#ecfff2','#62bd7c','#08713b'],accent:'#176c3e',particle:'rgba(67,147,91,.45)'},
  white:{bg:['#ffffff','#edf6f4','#d8e8e5'],ring:['#ffffff','#d9eeee','#9abfc0'],accent:'#699799',particle:'rgba(175,213,213,.55)'}
};

const LEVELS=[
 {name:'第一关 · 桃粉玉',theme:'pink',
  rings:[
   {id:'A',x:.50,y:.22,r:.105,a:2.2},
   {id:'B',x:.34,y:.45,r:.11,a:.4},
   {id:'C',x:.66,y:.45,r:.11,a:3.5},
   {id:'D',x:.50,y:.69,r:.115,a:5.1}],
  clasps:[['A','B'],['A','C'],['B','D'],['C','D']]},
 {name:'第二关 · 紫水晶',theme:'purple',
  rings:[
   {id:'A',x:.50,y:.16,r:.09,a:1.9},{id:'B',x:.30,y:.35,r:.10,a:.3},
   {id:'C',x:.50,y:.37,r:.105,a:4.5},{id:'D',x:.70,y:.35,r:.10,a:3.1},
   {id:'E',x:.37,y:.62,r:.105,a:5.4},{id:'F',x:.63,y:.62,r:.105,a:1.2},
   {id:'G',x:.50,y:.82,r:.09,a:4.8}],
  clasps:[['A','B'],['A','C'],['A','D'],['B','E'],['C','E'],['C','F'],['D','F'],['E','G'],['F','G']]},
 {name:'第三关 · 帝王绿',theme:'green',
  rings:[
   {id:'A',x:.35,y:.20,r:.10,a:2.6},{id:'B',x:.65,y:.20,r:.10,a:.5},
   {id:'C',x:.25,y:.47,r:.10,a:4.7},{id:'D',x:.50,y:.44,r:.12,a:1.1},
   {id:'E',x:.75,y:.47,r:.10,a:3.5},{id:'F',x:.37,y:.72,r:.105,a:5.5},
   {id:'G',x:.63,y:.72,r:.105,a:2.0}],
  clasps:[['A','C'],['A','D'],['B','D'],['B','E'],['C','F'],['D','F'],['D','G'],['E','G']]},
 {name:'第四关 · 冰种白玉',theme:'white',
  rings:[
   {id:'A',x:.50,y:.16,r:.09,a:2.8},{id:'B',x:.30,y:.33,r:.095,a:.5},
   {id:'C',x:.70,y:.33,r:.095,a:4.2},{id:'D',x:.23,y:.58,r:.10,a:1.2},
   {id:'E',x:.50,y:.52,r:.115,a:5.0},{id:'F',x:.77,y:.58,r:.10,a:2.5},
   {id:'G',x:.38,y:.79,r:.095,a:3.8},{id:'H',x:.62,y:.79,r:.095,a:.9}],
  clasps:[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['E','H'],['F','H']]}
];

function resize(){
 const r=canvas.getBoundingClientRect();W=r.width;H=r.height;
 canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
 ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',resize);

function loadLevel(i){
 levelIndex=i%LEVELS.length;const L=LEVELS[levelIndex],t=THEMES[L.theme];
 levelName.textContent=L.name;stage.style.background='linear-gradient(180deg,#173330,#21433f 58%,#102826)';
 rings=L.rings.map(r=>({...r,angle:r.a,velocity:0,fall:0,alpha:1,removed:false}));
 clasps=L.clasps.map((c,n)=>({id:n,a:c[0],b:c[1],open:false,flash:0}));
 selected=null;nextBtn.classList.add('hidden');hint.textContent='旋转玉镯，让缺口经过金扣即可脱开';
 particles=[];
}
function ring(id){return rings.find(r=>r.id===id)}
function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function radius(r){return r.r*Math.min(W,H)}
function pick(p){
 let best=null,score=1e9;
 for(const r of rings){
  if(r.removed||r.alpha<.15)continue;
  const d=Math.hypot(p.x-r.x*W,p.y-(r.y*H+r.fall)),rr=radius(r);
  if(d<rr*.35||d>rr*1.55)continue;
  const s=Math.abs(d-rr);
  if(s<score){score=s;best=r}
 }
 return best;
}
function down(e){
 e.preventDefault();selected=pick(pos(e));if(!selected)return;
 selected.velocity=0;const p=pos(e);lastAngle=Math.atan2(p.y-(selected.y*H+selected.fall),p.x-selected.x*W);
 try{canvas.setPointerCapture(e.pointerId)}catch(_){}
}
function move(e){
 if(!selected)return;e.preventDefault();
 const p=pos(e),a=Math.atan2(p.y-(selected.y*H+selected.fall),p.x-selected.x*W);
 const d=norm(a-lastAngle);selected.angle+=d;selected.velocity=d;lastAngle=a;
 testClasps(selected.id);
}
function up(e){
 if(selected){testClasps(selected.id);selected=null}
 try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(_){}
}
canvas.addEventListener('pointerdown',down,{passive:false});
canvas.addEventListener('pointermove',move,{passive:false});
canvas.addEventListener('pointerup',up,{passive:false});
canvas.addEventListener('pointercancel',up,{passive:false});

function direction(a,b){return Math.atan2((b.y-a.y)*H,(b.x-a.x)*W)}
function gapAligned(r,dir){return Math.abs(norm(r.angle-dir))<.25}
function testClasps(id){
 for(const c of clasps){
  if(c.open||!(c.a===id||c.b===id))continue;
  const A=ring(c.a),B=ring(c.b);if(A.removed||B.removed)continue;
  const ab=direction(A,B),ba=norm(ab+Math.PI);
  // 参考玩法：两侧开口同时穿过金扣。
  if(gapAligned(A,ab)&&gapAligned(B,ba)){
   A.angle=ab;B.angle=ba;A.velocity=B.velocity=0;c.open=true;c.flash=1;
   playUnlock();spawnSpark((A.x+B.x)*W/2,(A.y+B.y)*H/2);
  }
 }
 updateRemoval();
}
function updateRemoval(){
 for(const r of rings){
  if(r.removed)continue;
  const left=clasps.some(c=>!c.open&&(c.a===r.id||c.b===r.id));
  if(!left){r.removed=true;r.velocity=0;setTimeout(()=>playDrop(),80)}
 }
 if(clasps.every(c=>c.open)){
  hint.textContent='此结已解';nextBtn.classList.remove('hidden');
  for(let i=0;i<32;i++)spawnSpark(W/2,H*.48,true);
 }else hint.textContent='金扣已解开，继续旋转剩余玉镯';
}
function audio(){
 if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended') audioCtx.resume();
 return audioCtx;
}
function chime(freq,delay,gain,dur){
 if(!soundOn)return;
 const ac=audio(),now=ac.currentTime+delay;
 const osc=ac.createOscillator(),amp=ac.createGain(),filter=ac.createBiquadFilter();
 osc.type='sine';osc.frequency.setValueAtTime(freq,now);
 filter.type='highpass';filter.frequency.setValueAtTime(650,now);
 amp.gain.setValueAtTime(0.0001,now);
 amp.gain.exponentialRampToValueAtTime(gain,now+0.008);
 amp.gain.exponentialRampToValueAtTime(0.0001,now+dur);
 osc.connect(filter);filter.connect(amp);amp.connect(ac.destination);
 osc.start(now);osc.stop(now+dur+0.03);
}
function playUnlock(){
 chime(1174.66,0,.035,.55);
 chime(1760,.035,.022,.43);
 chime(2349.32,.075,.012,.30);
}
function playDrop(){chime(783.99,0,.018,.28)}
async function startMusic(){
 try{
  bgm.volume=.42;
  await bgm.play();
  musicOn=true;
  musicBtn.textContent='音乐：开';
 }catch(err){
  musicOn=false;
  musicBtn.textContent='音乐：缺文件';
  hint.textContent='请把音乐文件放进 assets，并命名为 hetang-yuese.mp3';
 }
}
function stopMusic(){
 bgm.pause();
 musicOn=false;
 musicBtn.textContent='音乐：关';
}
function spawnSpark(x,y,burst=false){
 const t=THEMES[LEVELS[levelIndex].theme];
 const n=burst?1:8;
 for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*(burst?4:2),vy:-.5-Math.random()*(burst?3:1.5),life:1,s:2+Math.random()*4,color:t.particle});
}
function drawBg(){
 const t=THEMES[LEVELS[levelIndex].theme];
 const time=performance.now()/1000;

 // 深色宣纸与月晕
 const g=ctx.createRadialGradient(W*.76,H*.13,4,W*.76,H*.13,W*.32);
 g.addColorStop(0,'rgba(250,226,166,.23)');
 g.addColorStop(.24,'rgba(218,198,148,.08)');
 g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

 // 月亮
 ctx.save();
 ctx.globalAlpha=.80;
 ctx.fillStyle='#ead9a8';
 ctx.shadowColor='rgba(244,222,164,.34)';
 ctx.shadowBlur=28;
 ctx.beginPath();ctx.arc(W*.78,H*.13,Math.min(W,H)*.055,0,Math.PI*2);ctx.fill();
 ctx.restore();

 // 远山
 ctx.save();ctx.globalAlpha=.32;ctx.fillStyle='#0a1c1c';
 ctx.beginPath();ctx.moveTo(0,H*.29);
 ctx.bezierCurveTo(W*.16,H*.20,W*.27,H*.31,W*.40,H*.23);
 ctx.bezierCurveTo(W*.58,H*.14,W*.69,H*.31,W*.84,H*.22);
 ctx.bezierCurveTo(W*.93,H*.18,W,H*.25,W,H*.25);
 ctx.lineTo(W,H*.42);ctx.lineTo(0,H*.42);ctx.closePath();ctx.fill();
 ctx.restore();

 // 水波
 ctx.save();ctx.strokeStyle='rgba(191,218,199,.12)';ctx.lineWidth=1;
 for(let i=0;i<9;i++){
  const y=H*(.25+i*.085);
  ctx.beginPath();ctx.moveTo(-20,y);
  ctx.bezierCurveTo(W*.28,y-8+Math.sin(time+i)*2,W*.68,y+8,W+20,y);
  ctx.stroke();
 }
 ctx.restore();

 // 荷叶剪影
 ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#0b2622';
 const leaves=[[.12,.84,.13],[.82,.79,.16],[.70,.91,.11],[.28,.94,.15]];
 for(const [x,y,r] of leaves){
  ctx.beginPath();ctx.ellipse(W*x,H*y,W*r,H*r*.36,-.12,0,Math.PI*2);ctx.fill();
 }
 ctx.strokeStyle='rgba(187,208,174,.18)';ctx.lineWidth=2;
 for(const [x,y] of leaves){ctx.beginPath();ctx.moveTo(W*x,H*y);ctx.lineTo(W*(x-.04),H);ctx.stroke()}
 ctx.restore();

 // 荷花
 ctx.save();ctx.translate(W*.83,H*.72);ctx.globalAlpha=.42;ctx.fillStyle='#d8b3b2';
 for(let i=0;i<8;i++){
  ctx.save();ctx.rotate(i*Math.PI/4);
  ctx.beginPath();ctx.ellipse(0,-18,8,22,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 ctx.fillStyle='#d5bc72';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.restore();

 // 流动薄雾
 const fog=ctx.createLinearGradient(0,H*.46,W,H*.58);
 fog.addColorStop(0,'rgba(222,234,220,0)');
 fog.addColorStop(.5,'rgba(222,234,220,.07)');
 fog.addColorStop(1,'rgba(222,234,220,0)');
 ctx.save();ctx.translate(Math.sin(time*.22)*22,0);ctx.fillStyle=fog;ctx.fillRect(-30,H*.42,W+60,H*.22);ctx.restore();
}
function tubeGradient(r,rr){
 const t=THEMES[LEVELS[levelIndex].theme];
 const g=ctx.createLinearGradient(-rr,-rr,rr,rr);
 g.addColorStop(0,t.ring[0]);g.addColorStop(.28,t.ring[1]);g.addColorStop(.57,t.ring[2]);g.addColorStop(.78,t.ring[1]);g.addColorStop(1,t.ring[0]);return g;
}
function drawRing(r){
 const rr=radius(r),cx=r.x*W,cy=r.y*H+r.fall,gap=.84,w=rr*.29;
 ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(cx,cy);ctx.lineCap='round';
 ctx.shadowColor='rgba(60,45,55,.19)';ctx.shadowBlur=14;ctx.shadowOffsetY=8;
 ctx.strokeStyle=tubeGradient(r,rr);ctx.lineWidth=w;
 ctx.beginPath();ctx.arc(0,0,rr,r.angle+gap/2,r.angle+Math.PI*2-gap/2);ctx.stroke();
 ctx.shadowColor='transparent';
 ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=w*.13;
 ctx.beginPath();ctx.arc(-rr*.04,-rr*.06,rr,r.angle+gap/2+.18,r.angle+Math.PI*1.18);ctx.stroke();
 // 玉纹
 ctx.globalAlpha*=.22;ctx.strokeStyle='#fff';ctx.lineWidth=1.2;
 for(let i=0;i<5;i++){const a=r.angle+.7+i*.9;ctx.beginPath();ctx.arc(0,0,rr,a,a+.22);ctx.stroke()}
 ctx.restore();
}
function claspGeometry(c){
 const A=ring(c.a),B=ring(c.b),a=direction(A,B);
 const ra=radius(A),rb=radius(B),wa=ra*.29,wb=rb*.29;
 return{
  angle:a,
  ax:A.x*W+Math.cos(a)*ra,ay:A.y*H+A.fall+Math.sin(a)*ra,
  bx:B.x*W-Math.cos(a)*rb,by:B.y*H+B.fall-Math.sin(a)*rb,
  wa,wb
 };
}
function goldGradient(size){
 const g=ctx.createLinearGradient(-size/2,0,size/2,0);
 g.addColorStop(0,'#6f420f');
 g.addColorStop(.18,'#b97925');
 g.addColorStop(.44,'#ffe6a0');
 g.addColorStop(.62,'#d49838');
 g.addColorStop(1,'#71420e');
 return g;
}
function roundedRectPath(x,y,w,h,r){
 const rr=Math.min(r,w/2,h/2);
 ctx.beginPath();
 ctx.moveTo(x+rr,y);
 ctx.arcTo(x+w,y,x+w,y+h,rr);
 ctx.arcTo(x+w,y+h,x,y+h,rr);
 ctx.arcTo(x,y+h,x,y,rr);
 ctx.arcTo(x,y,x+w,y,rr);
 ctx.closePath();
}
function drawCuffHalf(x,y,tube,radialAngle,front){
 // 金扣是一段紧贴玉管的短金套，不再画成独立圆环。
 const tangential=radialAngle+Math.PI/2;
 const w=tube*.86,h=tube*1.22;

 ctx.save();
 ctx.translate(x,y);
 ctx.rotate(tangential);

 if(!front){
  ctx.globalAlpha=.92;
  ctx.fillStyle='#6b3c0d';
  ctx.shadowColor='rgba(0,0,0,.32)';
  ctx.shadowBlur=5;ctx.shadowOffsetY=3;
  roundedRectPath(-w/2,-h/2,w,h,h*.26);
  ctx.fill();
 }else{
  ctx.fillStyle=goldGradient(w);
  ctx.shadowColor='rgba(0,0,0,.25)';
  ctx.shadowBlur=4;ctx.shadowOffsetY=2;
  // 前层只覆盖玉管中间区域，制造“金套包裹玉石”而不是圆圈悬浮。
  roundedRectPath(-w/2,-h*.34,w,h*.68,h*.22);
  ctx.fill();

  ctx.shadowColor='transparent';
  ctx.fillStyle='rgba(255,244,191,.76)';
  roundedRectPath(-w*.28,-h*.28,w*.12,h*.56,h*.08);
  ctx.fill();

  ctx.strokeStyle='rgba(103,57,10,.48)';
  ctx.lineWidth=1;
  roundedRectPath(-w/2,-h*.34,w,h*.68,h*.22);
  ctx.stroke();
 }
 ctx.restore();
}
function drawClaspLayer(front){
 for(const c of clasps){
  if(c.open)continue;
  const A=ring(c.a),B=ring(c.b);
  if(!A||!B||A.removed||B.removed)continue;
  const a=direction(A,B),ra=radius(A),rb=radius(B),ta=ra*.29,tb=rb*.29;
  const ax=A.x*W+Math.cos(a)*ra, ay=A.y*H+A.fall+Math.sin(a)*ra;
  const bx=B.x*W-Math.cos(a)*rb, by=B.y*H+B.fall-Math.sin(a)*rb;
  drawCuffHalf(ax,ay,ta,a,front);
  drawCuffHalf(bx,by,tb,a+Math.PI,front);
 }
}
function update(){
 for(const r of rings){
  if(!r.removed&&r!==selected){r.angle+=r.velocity;r.velocity*=.9}
  if(r.removed){r.fall+=1.5;r.alpha*=.965}
 }
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life*=.96}
 particles=particles.filter(p=>p.life>.04);
}
function drawParticles(){
 for(const p of particles){ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.x*.02);ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.7,0,0,Math.PI*2);ctx.fill();ctx.restore()}
}
function frame(){
 ctx.clearRect(0,0,W,H);drawBg();drawClaspLayer(false);rings.forEach(drawRing);drawClaspLayer(true);drawParticles();update();requestAnimationFrame(frame)
}
restartBtn.onclick=()=>loadLevel(levelIndex);
nextBtn.onclick=()=>loadLevel(levelIndex+1);
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.textContent='叮当：'+(soundOn?'开':'关');if(soundOn)playUnlock();};
musicBtn.onclick=()=>{if(musicOn)stopMusic();else startMusic();};
resize();loadLevel(0);frame();
