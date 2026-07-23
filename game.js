const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const stage=document.getElementById('stage');
const restartBtn=document.getElementById('restart');
const nextBtn=document.getElementById('next');
const sfxBtn=document.getElementById('sfx');
const musicBtn=document.getElementById('music');
const levelName=document.getElementById('levelName');
const hint=document.getElementById('hint');

let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
let levelIndex=2,rings=[],clasps=[],particles=[];
let selected=null,lastPointerAngle=0;
let sfxOn=true,musicOn=false,audioCtx=null,musicTimer=null,musicStep=0;

const THEMES={
 pink:{bg:['#fff9fb','#f5e0e9','#e9cbd8'],ring:['#fff8fb','#f7b2c9','#cc6c92','#8d3c61'],ink:'#a05673',petal:'rgba(228,130,166,.58)'},
 purple:{bg:['#fffaff','#eee2f7','#d5c0e7'],ring:['#fff9ff','#d6b3e6','#8a5ca8','#51306f'],ink:'#76528f',petal:'rgba(155,108,190,.56)'},
 green:{bg:['#fbfff9','#e1f1e4','#bedbc6'],ring:['#f3fff4','#8bd59d','#169253','#075e36'],ink:'#226b43',petal:'rgba(80,155,100,.48)'},
 white:{bg:['#ffffff','#ecf6f4','#d2e5e1'],ring:['#ffffff','#e5f5f2','#aacdca','#6e9e9b'],ink:'#668d89',petal:'rgba(169,211,205,.56)'}
};

const LEVELS=[
{name:'第一关 · 桃粉玉',theme:'pink',
 rings:[{id:'A',x:.38,y:.30,r:.12,a:2.7},{id:'B',x:.62,y:.30,r:.12,a:.3},{id:'C',x:.50,y:.50,r:.14,a:4.8},{id:'D',x:.37,y:.71,r:.12,a:1.0},{id:'E',x:.63,y:.71,r:.12,a:3.1}],
 clasps:[{a:'A',b:'B'},{a:'A',b:'C'},{a:'B',b:'C'},{a:'C',b:'D'},{a:'C',b:'E'},{a:'D',b:'E'}]},
{name:'第二关 · 紫水晶',theme:'purple',
 rings:[{id:'A',x:.50,y:.19,r:.10,a:2.5},{id:'B',x:.31,y:.37,r:.11,a:.2},{id:'C',x:.69,y:.37,r:.11,a:3.6},{id:'D',x:.50,y:.49,r:.13,a:5.0},{id:'E',x:.32,y:.68,r:.11,a:1.2},{id:'F',x:.68,y:.68,r:.11,a:4.2},{id:'G',x:.50,y:.82,r:.10,a:.7}],
 clasps:[{a:'A',b:'B'},{a:'A',b:'C'},{a:'B',b:'D'},{a:'C',b:'D'},{a:'B',b:'E'},{a:'D',b:'E'},{a:'D',b:'F'},{a:'C',b:'F'},{a:'E',b:'G'},{a:'F',b:'G'}]},
{name:'第三关 · 帝王绿',theme:'green',
 rings:[{id:'A',x:.36,y:.23,r:.115,a:2.8},{id:'B',x:.64,y:.23,r:.115,a:.4},{id:'C',x:.24,y:.49,r:.11,a:4.8},{id:'D',x:.50,y:.47,r:.14,a:1.2},{id:'E',x:.76,y:.49,r:.11,a:3.4},{id:'F',x:.36,y:.73,r:.115,a:5.2},{id:'G',x:.64,y:.73,r:.115,a:2.1}],
 clasps:[{a:'A',b:'B'},{a:'A',b:'C'},{a:'A',b:'D'},{a:'B',b:'D'},{a:'B',b:'E'},{a:'C',b:'D'},{a:'D',b:'E'},{a:'C',b:'F'},{a:'D',b:'F'},{a:'D',b:'G'},{a:'E',b:'G'},{a:'F',b:'G'}]},
{name:'第四关 · 冰种白玉',theme:'white',
 rings:[{id:'A',x:.50,y:.18,r:.10,a:2.4},{id:'B',x:.30,y:.35,r:.11,a:.4},{id:'C',x:.70,y:.35,r:.11,a:4.0},{id:'D',x:.22,y:.59,r:.10,a:1.1},{id:'E',x:.50,y:.50,r:.14,a:5.1},{id:'F',x:.78,y:.59,r:.10,a:2.7},{id:'G',x:.38,y:.77,r:.11,a:3.7},{id:'H',x:.62,y:.77,r:.11,a:.8}],
 clasps:[{a:'A',b:'B'},{a:'A',b:'C'},{a:'B',b:'E'},{a:'C',b:'E'},{a:'B',b:'D'},{a:'D',b:'G'},{a:'E',b:'G'},{a:'E',b:'H'},{a:'C',b:'F'},{a:'F',b:'H'},{a:'G',b:'H'}]}
];

function resize(){
 const b=canvas.getBoundingClientRect();W=b.width;H=b.height;
 canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
 ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',resize);

function ring(id){return rings.find(r=>r.id===id)}
function R(r){return r.r*Math.min(W,H)}
function norm(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a}
function pxy(e){const b=canvas.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top}}

function loadLevel(i){
 levelIndex=(i+LEVELS.length)%LEVELS.length;
 const L=LEVELS[levelIndex],t=THEMES[L.theme];
 levelName.textContent=L.name;
 stage.style.background=`radial-gradient(circle at 50% 34%,${t.bg[0]},${t.bg[1]} 58%,${t.bg[2]})`;
 rings=L.rings.map(r=>({...r,angle:r.a,velocity:0,fall:0,alpha:1,removed:false}));
 clasps=L.clasps.map((c,n)=>({...c,id:n,aLocked:true,bLocked:true,flash:0}));
 particles=[];selected=null;nextBtn.classList.add('hidden');
 hint.textContent='转动玉环，让缺口经过金扣';
}

function center(r){return{x:r.x*W,y:r.y*H+r.fall}}
function claspPoint(c){
 const A=ring(c.a),B=ring(c.b),ca=center(A),cb=center(B);
 const dx=cb.x-ca.x,dy=cb.y-ca.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 const ra=R(A),rb=R(B);
 // 共享金扣中心严格放在两只玉环外缘之间的中点，而不是放在缺口端点。
 const ax=ca.x+ux*ra, ay=ca.y+uy*ra;
 const bx=cb.x-ux*rb, by=cb.y-uy*rb;
 return{x:(ax+bx)/2,y:(ay+by)/2,angle:Math.atan2(dy,dx),ax,ay,bx,by};
}
function gapDirection(r){return r.angle}
function angularDistance(a,b){return Math.abs(norm(a-b))}
function sideDirection(c,side){
 const A=ring(c.a),B=ring(c.b);
 return side==='a'?Math.atan2((B.y-A.y)*H,(B.x-A.x)*W):Math.atan2((A.y-B.y)*H,(A.x-B.x)*W);
}
function testRing(id){
 const r=ring(id);
 for(const c of clasps){
  if(c.a===id && c.aLocked && angularDistance(gapDirection(r),sideDirection(c,'a'))<.25){
   c.aLocked=false;playJade();sparkAt(c);
  }
  if(c.b===id && c.bLocked && angularDistance(gapDirection(r),sideDirection(c,'b'))<.25){
   c.bLocked=false;playJade();sparkAt(c);
  }
 }
 // 金扣只有两侧都脱开才消失。
 for(const c of clasps) if(!c.aLocked&&!c.bLocked) c.flash=1;
 updateRemoved();
}
function updateRemoved(){
 for(const r of rings){
  if(r.removed)continue;
  const locked=clasps.some(c=>(c.a===r.id&&c.aLocked)||(c.b===r.id&&c.bLocked));
  if(!locked){r.removed=true;r.velocity=0;setTimeout(playDrop,80)}
 }
 if(clasps.every(c=>!c.aLocked&&!c.bLocked)){
  hint.textContent='此结已解';
  nextBtn.classList.remove('hidden');
 }else{
  hint.textContent='金扣会留在尚未脱开的玉环上';
 }
}

function pick(p){
 let best=null,score=1e9;
 for(const r of rings){
  if(r.removed||r.alpha<.15)continue;
  const c=center(r),rr=R(r),d=Math.hypot(p.x-c.x,p.y-c.y);
  if(d<rr*.42||d>rr*1.55)continue;
  const s=Math.abs(d-rr);if(s<score){score=s;best=r}
 }
 return best;
}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();selected=pick(pxy(e));if(!selected)return;
 selected.velocity=0;const p=pxy(e),c=center(selected);
 lastPointerAngle=Math.atan2(p.y-c.y,p.x-c.x);
 try{canvas.setPointerCapture(e.pointerId)}catch(_){}
},{passive:false});
canvas.addEventListener('pointermove',e=>{
 if(!selected)return;e.preventDefault();
 const p=pxy(e),c=center(selected),a=Math.atan2(p.y-c.y,p.x-c.x),d=norm(a-lastPointerAngle);
 selected.angle+=d;selected.velocity=d;lastPointerAngle=a;testRing(selected.id);
},{passive:false});
function release(e){
 if(selected){testRing(selected.id);selected=null}
 try{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch(_){}
}
canvas.addEventListener('pointerup',release,{passive:false});
canvas.addEventListener('pointercancel',release,{passive:false});

function audio(){
 if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;
}
function ping(freq,delay=0,gain=.032,dur=.48){
 if(!sfxOn)return;
 const ac=audio(),o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
 o.type='sine';o.frequency.setValueAtTime(freq,ac.currentTime+delay);
 f.type='highpass';f.frequency.value=500;
 g.gain.setValueAtTime(.0001,ac.currentTime+delay);
 g.gain.exponentialRampToValueAtTime(gain,ac.currentTime+delay+.006);
 g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+delay+dur);
 o.connect(f).connect(g).connect(ac.destination);o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur);
}
function playJade(){ping(1175,0,.034,.55);ping(1760,.035,.022,.42);ping(2350,.075,.012,.30)}
function playDrop(){ping(740,0,.018,.28)}
function musicTone(freq,start,dur,gain=.012){
 const ac=audio(),o=ac.createOscillator(),g=ac.createGain();
 o.type='sine';o.frequency.value=freq;
 g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(gain,start+.25);
 g.gain.exponentialRampToValueAtTime(.0001,start+dur);
 o.connect(g).connect(ac.destination);o.start(start);o.stop(start+dur);
}
const PENTA=[261.63,293.66,329.63,392,440,523.25,587.33,659.25];
function startMusic(){
 if(musicTimer)return;musicOn=true;musicBtn.textContent='音乐：开';
 const tick=()=>{
  if(!musicOn)return;
  const ac=audio(),now=ac.currentTime,n=PENTA[musicStep%PENTA.length];
  musicTone(n,now,.95,.008);musicTone(n/2,now,.95,.005);
  musicStep=(musicStep+[1,2,1,3,2][musicStep%5])%PENTA.length;
 };
 tick();musicTimer=setInterval(tick,900);
}
function stopMusic(){musicOn=false;musicBtn.textContent='音乐：关';clearInterval(musicTimer);musicTimer=null}

function sparkAt(c){
 const p=claspPoint(c),t=THEMES[LEVELS[levelIndex].theme];
 for(let i=0;i<9;i++)particles.push({x:p.x,y:p.y,vx:(Math.random()-.5)*2.3,vy:-.4-Math.random()*1.5,life:1,s:1.5+Math.random()*3,color:t.petal});
}

function drawBackground(){
 const t=THEMES[LEVELS[levelIndex].theme];
 ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle=t.ink;ctx.lineWidth=1;
 for(let i=0;i<7;i++){const y=H*(.15+i*.12);ctx.beginPath();ctx.moveTo(-20,y);ctx.bezierCurveTo(W*.3,y-12,W*.7,y+12,W+20,y);ctx.stroke()}
 ctx.restore();
}
function ringGradient(rr){
 const t=THEMES[LEVELS[levelIndex].theme],g=ctx.createLinearGradient(-rr,-rr,rr,rr);
 g.addColorStop(0,t.ring[0]);g.addColorStop(.24,t.ring[1]);g.addColorStop(.52,t.ring[2]);g.addColorStop(.74,t.ring[3]);g.addColorStop(1,t.ring[0]);return g;
}
function drawRing(r){
 const rr=R(r),c=center(r),gap=.82,w=rr*.29;
 ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(c.x,c.y);ctx.lineCap='round';
 ctx.shadowColor='rgba(43,35,39,.20)';ctx.shadowBlur=13;ctx.shadowOffsetY=7;
 ctx.strokeStyle=ringGradient(rr);ctx.lineWidth=w;
 ctx.beginPath();ctx.arc(0,0,rr,r.angle+gap/2,r.angle+Math.PI*2-gap/2);ctx.stroke();
 ctx.shadowColor='transparent';ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=w*.12;
 ctx.beginPath();ctx.arc(-rr*.025,-rr*.04,rr,r.angle+gap/2+.18,r.angle+Math.PI*1.15);ctx.stroke();
 ctx.restore();
}

/* 金扣真正“扣住”的关键：
   1. 先画后半金箍；
   2. 再画玉环；
   3. 最后画前半金箍；
   这样玉环会穿过金箍中央，形成遮挡关系，不再像贴纸或悬浮圆柱。
*/
function goldGradient(w){
 const g=ctx.createLinearGradient(-w/2,0,w/2,0);
 g.addColorStop(0,'#6f3d0e');g.addColorStop(.18,'#b96f21');g.addColorStop(.46,'#ffe39a');
 g.addColorStop(.67,'#d48b2f');g.addColorStop(1,'#6e3b0c');return g;
}
function drawHalfCuff(c,side,front){
 const p=claspPoint(c),r=ring(side==='a'?c.a:c.b),locked=side==='a'?c.aLocked:c.bLocked;
 if(!locked)return;
 const dir=sideDirection(c,side),rr=R(r),tube=rr*.29,cc=center(r);
 const x=cc.x+Math.cos(dir)*rr,y=cc.y+Math.sin(dir)*rr;
 const w=tube*1.42,h=tube*.96;
 ctx.save();ctx.translate(x,y);ctx.rotate(dir);
 ctx.lineWidth=Math.max(5,tube*.34);ctx.strokeStyle=goldGradient(w);ctx.lineCap='round';
 ctx.shadowColor=front?'rgba(70,37,8,.28)':'transparent';ctx.shadowBlur=front?5:0;
 ctx.beginPath();
 if(front) ctx.arc(0,0,w*.43,-Math.PI/2,Math.PI/2);
 else ctx.arc(0,0,w*.43,Math.PI/2,Math.PI*1.5);
 ctx.stroke();
 if(front){
   ctx.strokeStyle='rgba(255,238,170,.82)';ctx.lineWidth=Math.max(1,tube*.055);
   ctx.beginPath();ctx.arc(-1,0,w*.43,-Math.PI/2+.12,Math.PI/2-.12);ctx.stroke();
 }
 ctx.restore();
}
function drawBackClasps(){
 for(const c of clasps){drawHalfCuff(c,'a',false);drawHalfCuff(c,'b',false)}
}
function drawFrontClasps(){
 for(const c of clasps){drawHalfCuff(c,'a',true);drawHalfCuff(c,'b',true)}
}

function update(){
 for(const r of rings){
  if(!r.removed&&r!==selected){r.angle+=r.velocity;r.velocity*=.90}
  if(r.removed){r.fall+=1.55;r.alpha*=.965}
 }
 for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life*=.96}
 particles=particles.filter(p=>p.life>.04);
}
function drawParticles(){
 for(const p of particles){ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.x*.018);
 ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.65,0,0,Math.PI*2);ctx.fill();ctx.restore()}
}
function frame(){
 ctx.clearRect(0,0,W,H);
 drawBackground();
 drawBackClasps();
 rings.forEach(drawRing);
 drawFrontClasps();
 drawParticles();
 update();
 requestAnimationFrame(frame);
}

restartBtn.onclick=()=>loadLevel(levelIndex);
nextBtn.onclick=()=>loadLevel(levelIndex+1);
sfxBtn.onclick=()=>{sfxOn=!sfxOn;sfxBtn.textContent='叮当：'+(sfxOn?'开':'关');if(sfxOn)playJade()};
musicBtn.onclick=()=>musicOn?stopMusic():startMusic();

resize();loadLevel(levelIndex);frame();
