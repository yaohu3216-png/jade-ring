
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const nextBtn = document.getElementById('nextBtn');
const levelText = document.getElementById('levelText');
const message = document.getElementById('message');

const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0;
let activeRing = null;
let lastPointerAngle = 0;
let dragVelocity = 0;
let currentLevel = 0;
let rings = [];
let petals = [];
let completed = false;

const levels = [
  {
    name:'第一关',
    rings:[
      {x:.50,y:.32,r:.105,gap:58,target:Math.PI/2,color:'green'},
      {x:.36,y:.52,r:.115,gap:58,target:0,color:'lavender'},
      {x:.64,y:.52,r:.115,gap:58,target:Math.PI,color:'white'},
      {x:.50,y:.73,r:.125,gap:58,target:-Math.PI/2,color:'green'}
    ]
  },
  {
    name:'第二关',
    rings:[
      {x:.50,y:.22,r:.095,gap:52,target:Math.PI/2,color:'lavender'},
      {x:.31,y:.39,r:.105,gap:52,target:0,color:'green'},
      {x:.50,y:.42,r:.108,gap:52,target:-Math.PI/2,color:'white'},
      {x:.69,y:.39,r:.105,gap:52,target:Math.PI,color:'green'},
      {x:.36,y:.64,r:.112,gap:52,target:0,color:'white'},
      {x:.64,y:.64,r:.112,gap:52,target:Math.PI,color:'lavender'},
      {x:.50,y:.80,r:.10,gap:52,target:-Math.PI/2,color:'green'}
    ]
  }
];

const palette = {
  green:['#e9fff0','#88c59d','#4d8d68'],
  lavender:['#fff0ff','#c39ad8','#8a5ba8'],
  white:['#ffffff','#e8f2eb','#b8cec1']
};

function resize(){
  const rect = canvas.getBoundingClientRect();
  W = rect.width; H = rect.height;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  createPetals();
}
window.addEventListener('resize', resize);

function createPetals(){
  petals = Array.from({length:22},(_,i)=>({
    x:Math.random()*W,
    y:Math.random()*H,
    s:2+Math.random()*4,
    vx:-.12+Math.random()*.24,
    vy:.18+Math.random()*.34,
    a:Math.random()*Math.PI*2,
    va:-.015+Math.random()*.03
  }));
}

function norm(a){
  while(a > Math.PI) a -= Math.PI*2;
  while(a < -Math.PI) a += Math.PI*2;
  return a;
}

function loadLevel(i){
  currentLevel = i % levels.length;
  completed = false;
  nextBtn.classList.add('hidden');
  message.textContent = '轻触玉环，沿圆周拖动';
  levelText.textContent = levels[currentLevel].name;
  rings = levels[currentLevel].rings.map((r,idx)=>({
    ...r,
    angle:(idx*1.37 + .45)%(Math.PI*2),
    velocity:0,
    solved:false,
    falling:false,
    alpha:1,
    dy:0,
    scale:1,
    pulse:0
  }));
}

function pointerPos(e){
  const rect = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return {x:p.clientX-rect.left,y:p.clientY-rect.top};
}

function pickRing(p){
  for(let i=rings.length-1;i>=0;i--){
    const r=rings[i];
    if(r.solved) continue;
    const cx=r.x*W, cy=r.y*H+r.dy;
    const rr=r.r*Math.min(W,H);
    const d=Math.hypot(p.x-cx,p.y-cy);
    if(d>rr*.58 && d<rr*1.25) return r;
  }
  return null;
}

function start(e){
  e.preventDefault();
  const p=pointerPos(e);
  activeRing=pickRing(p);
  if(!activeRing) return;
  lastPointerAngle=Math.atan2(p.y-(activeRing.y*H+activeRing.dy),p.x-activeRing.x*W);
  dragVelocity=0;
  activeRing.pulse=1;
}
function move(e){
  if(!activeRing) return;
  e.preventDefault();
  const p=pointerPos(e);
  const a=Math.atan2(p.y-(activeRing.y*H+activeRing.dy),p.x-activeRing.x*W);
  const d=norm(a-lastPointerAngle);
  activeRing.angle+=d;
  dragVelocity=d;
  activeRing.velocity=d;
  lastPointerAngle=a;
}
function end(){
  if(!activeRing) return;
  const r=activeRing;
  activeRing=null;
  const diff=Math.abs(norm(r.angle-r.target));
  if(diff < 0.25){
    r.angle=r.target;
    r.velocity=0;
    r.solved=true;
    r.falling=true;
    message.textContent='叮——玉环已解';
    setTimeout(checkComplete,420);
  }
}

canvas.addEventListener('pointerdown',start);
window.addEventListener('pointermove',move,{passive:false});
window.addEventListener('pointerup',end);
canvas.addEventListener('touchstart',start,{passive:false});
canvas.addEventListener('touchmove',move,{passive:false});
window.addEventListener('touchend',end);

restartBtn.addEventListener('click',()=>loadLevel(currentLevel));
nextBtn.addEventListener('click',()=>loadLevel(currentLevel+1));

function checkComplete(){
  if(rings.every(r=>r.solved)){
    completed=true;
    message.textContent='此结已解';
    nextBtn.classList.remove('hidden');
    burstPetals();
  }
}

function burstPetals(){
  for(let i=0;i<36;i++){
    petals.push({
      x:W/2+(Math.random()-.5)*80,
      y:H*.52+(Math.random()-.5)*50,
      s:2+Math.random()*5,
      vx:(Math.random()-.5)*2.1,
      vy:-1.4-Math.random()*1.4,
      a:Math.random()*Math.PI*2,
      va:-.06+Math.random()*.12
    });
  }
}

function drawBackground(){
  const g=ctx.createRadialGradient(W*.5,H*.36,20,W*.5,H*.45,Math.max(W,H)*.72);
  g.addColorStop(0,'rgba(255,255,255,.92)');
  g.addColorStop(.62,'rgba(241,249,244,.78)');
  g.addColorStop(1,'rgba(213,231,220,.28)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.globalAlpha=.17;
  ctx.strokeStyle='#83a88f';
  ctx.lineWidth=1.2;
  for(let i=0;i<8;i++){
    ctx.beginPath();
    const y=H*(.14+i*.105);
    ctx.moveTo(-30,y);
    ctx.bezierCurveTo(W*.25,y-18,W*.72,y+18,W+30,y-6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPetals(){
  for(const p of petals){
    p.x+=p.vx; p.y+=p.vy; p.a+=p.va; p.vy+=completed?.006:.001;
    if(p.y>H+20 || p.x<-30 || p.x>W+30){
      p.x=Math.random()*W;p.y=-20;p.vx=-.12+Math.random()*.24;p.vy=.18+Math.random()*.34;
    }
    ctx.save();
    ctx.translate(p.x,p.y);ctx.rotate(p.a);
    ctx.fillStyle='rgba(238,159,185,.68)';
    ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.75,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

function drawConnector(x,y,angle,size){
  ctx.save();
  ctx.translate(x,y);ctx.rotate(angle);
  const grad=ctx.createLinearGradient(-size,0,size,0);
  grad.addColorStop(0,'#9b7336');
  grad.addColorStop(.35,'#f7d796');
  grad.addColorStop(.7,'#c18a43');
  grad.addColorStop(1,'#8e642e');
  ctx.fillStyle=grad;
  roundRect(-size*.18,-size*.40,size*.36,size*.80,size*.14);
  ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.7)';
  ctx.lineWidth=1.2;
  ctx.stroke();
  ctx.restore();
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,r);
}

function drawRing(r){
  const cx=r.x*W, cy=r.y*H+r.dy;
  const rr=r.r*Math.min(W,H)*r.scale;
  const gap=r.gap*Math.PI/180;
  const start=r.angle+gap/2;
  const end=r.angle+Math.PI*2-gap/2;
  const width=rr*.28;

  ctx.save();
  ctx.globalAlpha=r.alpha;
  ctx.translate(cx,cy);

  const shadow=ctx.createRadialGradient(0,0,rr*.5,0,0,rr*1.18);
  shadow.addColorStop(0,'rgba(0,0,0,0)');
  shadow.addColorStop(1,'rgba(66,96,76,.12)');
  ctx.fillStyle=shadow;
  ctx.beginPath();ctx.arc(0,6,rr*1.17,0,Math.PI*2);ctx.fill();

  ctx.lineCap='round';
  const colors=palette[r.color];
  const grad=ctx.createLinearGradient(-rr,-rr,rr,rr);
  grad.addColorStop(0,colors[0]);
  grad.addColorStop(.35,colors[1]);
  grad.addColorStop(.72,colors[2]);
  grad.addColorStop(1,colors[0]);

  ctx.strokeStyle=grad;
  ctx.lineWidth=width;
  ctx.beginPath();ctx.arc(0,0,rr,start,end);ctx.stroke();

  ctx.strokeStyle='rgba(255,255,255,.72)';
  ctx.lineWidth=width*.15;
  ctx.beginPath();ctx.arc(-rr*.05,-rr*.05,rr,start+.20,end-1.55);ctx.stroke();

  ctx.strokeStyle='rgba(35,73,51,.16)';
  ctx.lineWidth=width*.10;
  ctx.beginPath();ctx.arc(rr*.03,rr*.03,rr,start+2.15,end-.20);ctx.stroke();

  const a1=r.angle-gap/2, a2=r.angle+gap/2;
  drawEndCap(rr,a1,width,colors);
  drawEndCap(rr,a2,width,colors);

  const targetX=Math.cos(r.target)*rr;
  const targetY=Math.sin(r.target)*rr;
  drawConnector(targetX,targetY,r.target,rr*.42);

  if(r.pulse>0){
    ctx.globalAlpha*=r.pulse*.4;
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,rr*1.22,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

function drawEndCap(rr,a,width,colors){
  const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
  ctx.save();
  ctx.translate(x,y);
  const g=ctx.createRadialGradient(-width*.15,-width*.18,2,0,0,width*.6);
  g.addColorStop(0,'#fff');
  g.addColorStop(.45,colors[1]);
  g.addColorStop(1,colors[2]);
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(0,0,width*.52,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function update(){
  for(const r of rings){
    if(r.pulse>0) r.pulse*=.9;
    if(!r.solved && r!==activeRing){
      r.angle+=r.velocity;
      r.velocity*=.93;
    }
    if(r.falling){
      r.dy+=1.2;
      r.scale*=.992;
      r.alpha*=.965;
      if(r.alpha<.03){r.alpha=0;r.falling=false;}
    }
  }
}

function render(){
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawPetals();

  ctx.save();
  ctx.globalAlpha=.20;
  ctx.fillStyle='#86aa95';
  ctx.beginPath();
  ctx.ellipse(W*.50,H*.91,W*.38,H*.055,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  rings.forEach(drawRing);

  update();
  requestAnimationFrame(render);
}

resize();
loadLevel(0);
render();
