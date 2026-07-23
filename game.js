
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const nextBtn = document.getElementById('nextBtn');
const levelText = document.getElementById('levelText');
const message = document.getElementById('message');

let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2);
let rings=[],links=[],petals=[];
let activeRing=null,lastPointerAngle=0;
let currentLevel=0,completed=false;

const palette={
  green:['#ecfff2','#93d1a8','#4e936c'],
  lavender:['#fff1ff','#c7a1db','#8d5cac'],
  white:['#ffffff','#e9f3ed','#b9cec2']
};

const levels=[
  {
    name:'第一关',
    rings:[
      {id:'A',x:.50,y:.22,r:.085,color:'green',angle:2.2},
      {id:'B',x:.34,y:.43,r:.10,color:'lavender',angle:.3},
      {id:'C',x:.66,y:.43,r:.10,color:'white',angle:3.7},
      {id:'D',x:.50,y:.66,r:.105,color:'green',angle:5.1}
    ],
    links:[
      ['A','B'],['A','C'],['B','D'],['C','D']
    ]
  },
  {
    name:'第二关',
    rings:[
      {id:'A',x:.50,y:.16,r:.075,color:'lavender',angle:1.8},
      {id:'B',x:.31,y:.33,r:.088,color:'green',angle:.2},
      {id:'C',x:.50,y:.35,r:.09,color:'white',angle:4.2},
      {id:'D',x:.69,y:.33,r:.088,color:'green',angle:3.2},
      {id:'E',x:.38,y:.58,r:.092,color:'white',angle:5.2},
      {id:'F',x:.62,y:.58,r:.092,color:'lavender',angle:1.2},
      {id:'G',x:.50,y:.78,r:.083,color:'green',angle:4.7}
    ],
    links:[
      ['A','B'],['A','C'],['A','D'],
      ['B','E'],['C','E'],['C','F'],['D','F'],
      ['E','G'],['F','G']
    ]
  }
];

function resize(){
  const r=canvas.getBoundingClientRect();
  W=r.width;H=r.height;
  canvas.width=Math.round(W*DPR);
  canvas.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  petals=Array.from({length:18},()=>({
    x:Math.random()*W,y:Math.random()*H,
    s:2+Math.random()*4,vx:-.12+Math.random()*.24,
    vy:.18+Math.random()*.32,a:Math.random()*6.28,va:-.02+Math.random()*.04
  }));
}
addEventListener('resize',resize);

function loadLevel(i){
  currentLevel=i%levels.length;
  completed=false;
  nextBtn.classList.add('hidden');
  message.textContent='旋转玉环，让相连的两个开口彼此相对';
  levelText.textContent=levels[currentLevel].name;
  rings=levels[currentLevel].rings.map(r=>({
    ...r,velocity:0,solved:false,falling:false,dy:0,alpha:1,scale:1,pulse:0
  }));
  links=levels[currentLevel].links.map(([a,b])=>({a,b,solved:false}));
}
function getRing(id){return rings.find(r=>r.id===id)}
function norm(a){
  while(a>Math.PI)a-=Math.PI*2;
  while(a<-Math.PI)a+=Math.PI*2;
  return a;
}
function pointerPos(e){
  const r=canvas.getBoundingClientRect();
  const p=e.touches?e.touches[0]:e;
  return{x:p.clientX-r.left,y:p.clientY-r.top}
}
function pickRing(p){
  for(let i=rings.length-1;i>=0;i--){
    const r=rings[i];if(r.solved)return;
    const cx=r.x*W,cy=r.y*H+r.dy,rr=r.r*Math.min(W,H);
    const d=Math.hypot(p.x-cx,p.y-cy);
    if(d>rr*.55&&d<rr*1.28)return r;
  }
  return null;
}
function start(e){
  e.preventDefault();
  const p=pointerPos(e);
  activeRing=pickRing(p);
  if(!activeRing)return;
  lastPointerAngle=Math.atan2(p.y-(activeRing.y*H+activeRing.dy),p.x-activeRing.x*W);
  activeRing.pulse=1;
}
function move(e){
  if(!activeRing)return;
  e.preventDefault();
  const p=pointerPos(e);
  const a=Math.atan2(p.y-(activeRing.y*H+activeRing.dy),p.x-activeRing.x*W);
  const d=norm(a-lastPointerAngle);
  activeRing.angle+=d;
  activeRing.velocity=d;
  lastPointerAngle=a;
}
function end(){
  if(!activeRing)return;
  const r=activeRing;
  activeRing=null;
  trySolveLinksFor(r.id);
}
canvas.addEventListener('pointerdown',start);
addEventListener('pointermove',move,{passive:false});
addEventListener('pointerup',end);
canvas.addEventListener('touchstart',start,{passive:false});
canvas.addEventListener('touchmove',move,{passive:false});
addEventListener('touchend',end);

function angleBetween(a,b){
  return Math.atan2((b.y-a.y)*H,(b.x-a.x)*W);
}
function gapFaces(r,angle){
  return Math.abs(norm(r.angle-angle))<0.24;
}
function trySolveLinksFor(id){
  const candidates=links.filter(l=>!l.solved&&(l.a===id||l.b===id));
  let solvedAny=false;
  for(const link of candidates){
    const ra=getRing(link.a),rb=getRing(link.b);
    if(ra.solved||rb.solved)continue;
    const ab=angleBetween(ra,rb);
    const ba=norm(ab+Math.PI);
    if(gapFaces(ra,ab)&&gapFaces(rb,ba)){
      ra.angle=ab;rb.angle=ba;
      ra.velocity=rb.velocity=0;
      link.solved=true;
      solvedAny=true;
      setTimeout(()=>releasePair(link),120);
    }
  }
  if(!solvedAny)message.textContent='继续调整，让两个开口正对';
}
function releasePair(link){
  const ra=getRing(link.a),rb=getRing(link.b);
  const remainingA=links.some(l=>!l.solved&&(l.a===ra.id||l.b===ra.id));
  const remainingB=links.some(l=>!l.solved&&(l.a===rb.id||l.b===rb.id));

  if(!remainingA)solveRing(ra);
  if(!remainingB)solveRing(rb);

  message.textContent='金扣已解开';
  setTimeout(checkComplete,420);
}
function solveRing(r){
  if(r.solved)return;
  r.solved=true;
  r.falling=true;
}
function checkComplete(){
  if(links.every(l=>l.solved)){
    completed=true;
    rings.forEach(solveRing);
    message.textContent='此结已解';
    nextBtn.classList.remove('hidden');
    burstPetals();
  }
}
restartBtn.onclick=()=>loadLevel(currentLevel);
nextBtn.onclick=()=>loadLevel(currentLevel+1);

function burstPetals(){
  for(let i=0;i<30;i++)petals.push({
    x:W/2+(Math.random()-.5)*80,y:H*.52,
    s:2+Math.random()*5,vx:(Math.random()-.5)*2,
    vy:-1.2-Math.random()*1.5,a:Math.random()*6.28,va:-.06+Math.random()*.12
  });
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function drawBackground(){
  const g=ctx.createRadialGradient(W*.5,H*.36,20,W*.5,H*.5,Math.max(W,H)*.8);
  g.addColorStop(0,'rgba(255,255,255,.97)');
  g.addColorStop(.58,'rgba(242,249,245,.86)');
  g.addColorStop(1,'rgba(214,231,221,.45)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawPetals(){
  for(const p of petals){
    p.x+=p.vx;p.y+=p.vy;p.a+=p.va;p.vy+=completed?.006:.001;
    if(p.y>H+20||p.x<-30||p.x>W+30){
      p.x=Math.random()*W;p.y=-20;p.vx=-.12+Math.random()*.24;p.vy=.18+Math.random()*.32
    }
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
    ctx.fillStyle='rgba(237,158,185,.66)';
    ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.7,0,0,6.28);ctx.fill();ctx.restore();
  }
}
function drawLinks(){
  for(const l of links){
    const a=getRing(l.a),b=getRing(l.b);
    if(!a||!b||l.solved)continue;
    const ax=a.x*W,ay=a.y*H+a.dy,bx=b.x*W,by=b.y*H+b.dy;
    const mx=(ax+bx)/2,my=(ay+by)/2;
    const ang=Math.atan2(by-ay,bx-ax);
    const len=Math.min(20,Math.hypot(bx-ax,by-ay)*.18);
    ctx.save();ctx.translate(mx,my);ctx.rotate(ang);
    const g=ctx.createLinearGradient(-len,0,len,0);
    g.addColorStop(0,'#8e642e');g.addColorStop(.35,'#f8dda2');
    g.addColorStop(.68,'#c08a42');g.addColorStop(1,'#8e642e');
    ctx.fillStyle=g;roundRect(-len,-6,len*2,12,5);ctx.fill();
    ctx.restore();
  }
}
function drawRing(r){
  const cx=r.x*W,cy=r.y*H+r.dy;
  const rr=r.r*Math.min(W,H)*r.scale;
  const gap=0.82;
  const start=r.angle+gap/2,end=r.angle+Math.PI*2-gap/2;
  const width=rr*.28;
  const colors=palette[r.color];

  ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(cx,cy);
  ctx.lineCap='round';

  const grad=ctx.createLinearGradient(-rr,-rr,rr,rr);
  grad.addColorStop(0,colors[0]);grad.addColorStop(.34,colors[1]);
  grad.addColorStop(.72,colors[2]);grad.addColorStop(1,colors[0]);

  ctx.shadowColor='rgba(52,83,63,.18)';
  ctx.shadowBlur=10;ctx.shadowOffsetY=8;
  ctx.strokeStyle=grad;ctx.lineWidth=width;
  ctx.beginPath();ctx.arc(0,0,rr,start,end);ctx.stroke();
  ctx.shadowColor='transparent';

  ctx.strokeStyle='rgba(255,255,255,.78)';
  ctx.lineWidth=width*.14;
  ctx.beginPath();ctx.arc(-rr*.04,-rr*.05,rr,start+.18,end-1.45);ctx.stroke();

  ctx.strokeStyle='rgba(32,72,48,.15)';
  ctx.lineWidth=width*.09;
  ctx.beginPath();ctx.arc(rr*.03,rr*.03,rr,start+2.1,end-.18);ctx.stroke();

  if(r.pulse>0){
    ctx.globalAlpha*=r.pulse*.35;
    ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,rr*1.22,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function update(){
  for(const r of rings){
    if(r.pulse>0)r.pulse*=.9;
    if(!r.solved&&r!==activeRing){
      r.angle+=r.velocity;r.velocity*=.92;
    }
    if(r.falling){
      r.dy+=1.25;r.scale*=.993;r.alpha*=.965;
      if(r.alpha<.03){r.alpha=0;r.falling=false}
    }
  }
}
function render(){
  ctx.clearRect(0,0,W,H);
  drawBackground();drawPetals();drawLinks();
  rings.forEach(drawRing);
  update();
  requestAnimationFrame(render);
}

resize();loadLevel(0);render();
