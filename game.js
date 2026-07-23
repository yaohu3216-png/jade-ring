
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const nextBtn = document.getElementById('nextBtn');
const levelText = document.getElementById('levelText');
const message = document.getElementById('message');
const stageWrap = document.getElementById('stageWrap');

let W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
let rings=[],links=[],petals=[];
let activeRing=null,lastPointerAngle=0;
let currentLevel=0,completed=false;

const palette={
  pink:['#fff4f8','#f3aec7','#cf6e98'],
  rose:['#fff0f5','#e79bb8','#b8557f'],
  amethyst:['#fff2ff','#caa3e4','#8150ac'],
  lilac:['#fbf2ff','#b98bd9','#714798'],
  imperial:['#ecfff1','#70c88c','#087a43'],
  jade:['#effff4','#99d6aa','#4b9a68'],
  ice:['#ffffff','#dff4f7','#9bc7ce'],
  white:['#ffffff','#e8f1ed','#b8cdc1']
};

const levels=[
  {
    name:'第一关 · 桃粉',
    theme:'theme-spring',
    rings:[
      {id:'A',x:.50,y:.22,r:.082,color:'pink',angle:2.2,style:'round'},
      {id:'B',x:.35,y:.44,r:.098,color:'rose',angle:.3,style:'round'},
      {id:'C',x:.65,y:.44,r:.098,color:'white',angle:3.7,style:'slim'},
      {id:'D',x:.50,y:.68,r:.105,color:'pink',angle:5.1,style:'wide'}
    ],
    links:[['A','B'],['A','C'],['B','D'],['C','D']]
  },
  {
    name:'第二关 · 紫水晶',
    theme:'theme-amethyst',
    rings:[
      {id:'A',x:.50,y:.16,r:.074,color:'amethyst',angle:1.8,style:'faceted'},
      {id:'B',x:.31,y:.34,r:.086,color:'lilac',angle:.2,style:'round'},
      {id:'C',x:.50,y:.36,r:.09,color:'ice',angle:4.2,style:'slim'},
      {id:'D',x:.69,y:.34,r:.086,color:'amethyst',angle:3.2,style:'faceted'},
      {id:'E',x:.38,y:.59,r:.092,color:'lilac',angle:5.2,style:'round'},
      {id:'F',x:.62,y:.59,r:.092,color:'amethyst',angle:1.2,style:'wide'},
      {id:'G',x:.50,y:.79,r:.081,color:'ice',angle:4.7,style:'slim'}
    ],
    links:[['A','B'],['A','C'],['A','D'],['B','E'],['C','E'],['C','F'],['D','F'],['E','G'],['F','G']]
  },
  {
    name:'第三关 · 帝王绿',
    theme:'theme-imperial',
    rings:[
      {id:'A',x:.36,y:.22,r:.085,color:'imperial',angle:2.5,style:'wide'},
      {id:'B',x:.64,y:.22,r:.085,color:'jade',angle:.5,style:'round'},
      {id:'C',x:.28,y:.47,r:.092,color:'white',angle:4.8,style:'slim'},
      {id:'D',x:.50,y:.45,r:.105,color:'imperial',angle:1.3,style:'faceted'},
      {id:'E',x:.72,y:.47,r:.092,color:'jade',angle:3.4,style:'round'},
      {id:'F',x:.38,y:.72,r:.094,color:'imperial',angle:5.5,style:'wide'},
      {id:'G',x:.62,y:.72,r:.094,color:'white',angle:2.1,style:'slim'}
    ],
    links:[['A','C'],['A','D'],['B','D'],['B','E'],['C','F'],['D','F'],['D','G'],['E','G']]
  },
  {
    name:'第四关 · 冰玉',
    theme:'theme-ice',
    rings:[
      {id:'A',x:.50,y:.17,r:.077,color:'ice',angle:2.8,style:'slim'},
      {id:'B',x:.32,y:.33,r:.083,color:'white',angle:.4,style:'round'},
      {id:'C',x:.68,y:.33,r:.083,color:'ice',angle:4.4,style:'wide'},
      {id:'D',x:.26,y:.56,r:.09,color:'pink',angle:1.2,style:'round'},
      {id:'E',x:.50,y:.52,r:.096,color:'amethyst',angle:5.1,style:'faceted'},
      {id:'F',x:.74,y:.56,r:.09,color:'imperial',angle:2.4,style:'round'},
      {id:'G',x:.39,y:.77,r:.086,color:'ice',angle:3.9,style:'slim'},
      {id:'H',x:.61,y:.77,r:.086,color:'white',angle:.9,style:'wide'}
    ],
    links:[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['E','H'],['F','H']]
  }
];

function resize(){
  const r=canvas.getBoundingClientRect();
  W=r.width;H=r.height;
  canvas.width=Math.round(W*DPR);
  canvas.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  petals=Array.from({length:20},()=>({
    x:Math.random()*W,y:Math.random()*H,s:2+Math.random()*4,
    vx:-.12+Math.random()*.24,vy:.18+Math.random()*.32,
    a:Math.random()*Math.PI*2,va:-.02+Math.random()*.04
  }));
}
window.addEventListener('resize',resize);

function loadLevel(i){
  currentLevel=i%levels.length;
  completed=false;
  nextBtn.classList.add('hidden');
  const level=levels[currentLevel];
  message.textContent='旋转玉环，让相连开口彼此相对';
  levelText.textContent=level.name;
  stageWrap.className='stageWrap '+level.theme;
  rings=level.rings.map(r=>({
    ...r,velocity:0,solved:false,falling:false,dy:0,alpha:1,scale:1,pulse:0
  }));
  links=level.links.map(([a,b])=>({a,b,solved:false}));
}
function getRing(id){return rings.find(r=>r.id===id)}
function norm(a){
  while(a>Math.PI)a-=Math.PI*2;
  while(a<-Math.PI)a+=Math.PI*2;
  return a;
}
function pointerPos(e){
  const rect=canvas.getBoundingClientRect();
  return{x:e.clientX-rect.left,y:e.clientY-rect.top};
}
function pickRing(p){
  for(let i=rings.length-1;i>=0;i--){
    const r=rings[i];
    if(r.solved || r.alpha<0.15) continue;
    const cx=r.x*W,cy=r.y*H+r.dy,rr=r.r*Math.min(W,H);
    const d=Math.hypot(p.x-cx,p.y-cy);
    if(d>rr*.48&&d<rr*1.34)return r;
  }
  return null;
}
function start(e){
  e.preventDefault();
  const p=pointerPos(e);
  activeRing=pickRing(p);
  if(!activeRing)return;
  activeRing.velocity=0;
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
  trySolveLinksFor(activeRing.id);
}
function end(){
  if(!activeRing)return;
  const id=activeRing.id;
  activeRing=null;
  trySolveLinksFor(id);
}
canvas.addEventListener('pointerdown',start);
window.addEventListener('pointermove',move,{passive:false});
window.addEventListener('pointerup',end);
window.addEventListener('pointercancel',end);

function angleBetween(a,b){
  return Math.atan2((b.y-a.y)*H,(b.x-a.x)*W);
}
function gapFaces(r,angle){
  return Math.abs(norm(r.angle-angle))<0.28;
}
function trySolveLinksFor(id){
  const candidates=links.filter(l=>!l.solved&&(l.a===id||l.b===id));
  let solvedAny=false;
  for(const link of candidates){
    const ra=getRing(link.a),rb=getRing(link.b);
    if(!ra||!rb||ra.solved||rb.solved)continue;
    const ab=angleBetween(ra,rb),ba=norm(ab+Math.PI);
    if(gapFaces(ra,ab)&&gapFaces(rb,ba)){
      ra.angle=ab;rb.angle=ba;
      ra.velocity=rb.velocity=0;
      link.solved=true;
      solvedAny=true;
      releaseLink(link);
    }
  }
  if(!solvedAny && activeRing) message.textContent='继续调整，让金扣两侧开口正对';
}
function releaseLink(link){
  message.textContent='金扣已解开';
  setTimeout(()=>{
    const ra=getRing(link.a),rb=getRing(link.b);
    if(ra && !links.some(l=>!l.solved&&(l.a===ra.id||l.b===ra.id))) solveRing(ra);
    if(rb && !links.some(l=>!l.solved&&(l.a===rb.id||l.b===rb.id))) solveRing(rb);
    checkComplete();
  },140);
}
function solveRing(r){
  if(r.solved)return;
  r.solved=true;r.falling=true;
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
  for(let i=0;i<34;i++)petals.push({
    x:W/2+(Math.random()-.5)*90,y:H*.52,s:2+Math.random()*5,
    vx:(Math.random()-.5)*2,vy:-1.2-Math.random()*1.5,
    a:Math.random()*Math.PI*2,va:-.06+Math.random()*.12
  });
}
function roundedRect(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function drawBackground(){
  const g=ctx.createRadialGradient(W*.5,H*.36,20,W*.5,H*.5,Math.max(W,H)*.8);
  g.addColorStop(0,'rgba(255,255,255,.58)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function drawPetals(){
  const hue=currentLevel===1?'rgba(189,150,224,.52)':currentLevel===2?'rgba(130,201,145,.46)':'rgba(237,158,185,.64)';
  for(const p of petals){
    p.x+=p.vx;p.y+=p.vy;p.a+=p.va;p.vy+=completed?.006:.001;
    if(p.y>H+20||p.x<-30||p.x>W+30){
      p.x=Math.random()*W;p.y=-20;p.vx=-.12+Math.random()*.24;p.vy=.18+Math.random()*.32;
    }
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
    ctx.fillStyle=hue;ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.7,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}
function ringRadius(r){return r.r*Math.min(W,H)}
function edgePoint(r,toward){
  const cx=r.x*W,cy=r.y*H+r.dy,rr=ringRadius(r);
  const a=Math.atan2((toward.y-r.y)*H,(toward.x-r.x)*W);
  return{x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,a};
}
function drawLinks(){
  for(const l of links){
    if(l.solved)continue;
    const a=getRing(l.a),b=getRing(l.b);
    if(!a||!b||a.alpha<.1||b.alpha<.1)continue;
    const pa=edgePoint(a,b),pb=edgePoint(b,a);
    const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2;
    const ang=Math.atan2(pb.y-pa.y,pb.x-pa.x);
    const dist=Math.max(16,Math.hypot(pb.x-pa.x));
    ctx.save();ctx.translate(mx,my);ctx.rotate(ang);
    const g=ctx.createLinearGradient(-dist/2,0,dist/2,0);
    g.addColorStop(0,'#8e642e');g.addColorStop(.25,'#f8dda2');
    g.addColorStop(.58,'#c58c41');g.addColorStop(1,'#8e642e');
    ctx.fillStyle=g;roundedRect(-dist/2,-6,dist,12,5);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1;ctx.stroke();
    ctx.restore();
  }
}
function drawRing(r){
  const cx=r.x*W,cy=r.y*H+r.dy,rr=ringRadius(r)*r.scale;
  const gap=r.style==='slim'?0.72:r.style==='wide'?0.92:0.82;
  const width=rr*(r.style==='slim'?.22:r.style==='wide'?.34:.28);
  const start=r.angle+gap/2,end=r.angle+Math.PI*2-gap/2;
  const colors=palette[r.color];

  ctx.save();ctx.globalAlpha=r.alpha;ctx.translate(cx,cy);ctx.lineCap='round';

  const grad=ctx.createLinearGradient(-rr,-rr,rr,rr);
  grad.addColorStop(0,colors[0]);grad.addColorStop(.30,colors[1]);
  grad.addColorStop(.68,colors[2]);grad.addColorStop(1,colors[0]);

  ctx.shadowColor='rgba(52,83,63,.18)';ctx.shadowBlur=11;ctx.shadowOffsetY=8;
  ctx.strokeStyle=grad;ctx.lineWidth=width;
  ctx.beginPath();ctx.arc(0,0,rr,start,end);ctx.stroke();
  ctx.shadowColor='transparent';

  if(r.style==='faceted'){
    ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle='#fff';ctx.lineWidth=2;
    for(let i=0;i<10;i++){
      const a=start+(end-start)*(i/10);
      ctx.beginPath();ctx.arc(0,0,rr,a,a+.16);ctx.stroke();
    }
    ctx.restore();
  }

  ctx.strokeStyle='rgba(255,255,255,.78)';ctx.lineWidth=width*.14;
  ctx.beginPath();ctx.arc(-rr*.04,-rr*.05,rr,start+.16,end-1.35);ctx.stroke();

  ctx.strokeStyle='rgba(32,72,48,.14)';ctx.lineWidth=width*.09;
  ctx.beginPath();ctx.arc(rr*.03,rr*.03,rr,start+2.05,end-.16);ctx.stroke();

  if(r.pulse>0){
    ctx.globalAlpha*=r.pulse*.35;ctx.strokeStyle='#fff';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,rr*1.22,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function update(){
  for(const r of rings){
    if(r.pulse>0)r.pulse*=.9;
    if(!r.solved&&r!==activeRing){r.angle+=r.velocity;r.velocity*=.90}
    if(r.falling){
      r.dy+=1.35;r.scale*=.993;r.alpha*=.965;
      if(r.alpha<.03){r.alpha=0;r.falling=false}
    }
  }
}
function render(){
  ctx.clearRect(0,0,W,H);
  drawBackground();drawPetals();drawLinks();rings.forEach(drawRing);update();
  requestAnimationFrame(render);
}

resize();loadLevel(0);render();
