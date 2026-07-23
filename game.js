(()=>{
'use strict';
const $=s=>document.querySelector(s);
const canvas=$('#game'),ctx=canvas.getContext('2d');
const ui={level:$('#levelText'),moves:$('#movesText'),time:$('#timeText'),subtitle:$('#subtitle'),toast:$('#toast'),complete:$('#complete'),result:$('#resultText'),bgm:$('#bgm')};
let levelIndex=0,rings=[],locks=[],selected=null,lastAngle=0,moves=0,start=Date.now(),done=false,soundOn=true,musicOn=false,dpr=1,W=0,H=0,raf=0;
const norm=a=>((a%360)+360)%360;
const rad=d=>d*Math.PI/180;
const angleDiff=(a,b)=>Math.abs(((a-b+540)%360)-180);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function resize(){
 const r=canvas.getBoundingClientRect();
 dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);W=r.width;H=r.height;
 load(levelIndex,false);
}

function load(i,resetClock=true){
 levelIndex=(i+YH_LEVELS.length)%YH_LEVELS.length;
 const L=YH_LEVELS[levelIndex],s=Math.min(W,H),cx=W/2,cy=H/2+8;
 rings=L.rings.map((r,id)=>({id,x:cx+r[0]*W,y:cy+r[1]*H,r:r[2]*s,rot:r[3],gap:38,width:Math.max(14,s*.03),color:L.palette[id%L.palette.length],pulse:0}));
 locks=L.locks.map((q,id)=>({id,a:q[0],b:q[1],aa:q[2],ba:q[3],released:false,anim:0,flash:0}));
 moves=0;done=false;selected=null;if(resetClock)start=Date.now();
 ui.level.textContent=`${levelIndex+1} / ${YH_LEVELS.length}`;ui.moves.textContent='0';ui.time.textContent='00:00';
 ui.subtitle.textContent=L.name+' · 缺口相见，方可解结';ui.complete.classList.add('hidden');
}

function ringPoint(r,a){const t=rad(a);return{x:r.x+Math.cos(t)*r.r,y:r.y+Math.sin(t)*r.r}}
function aligned(r,target){return angleDiff(norm(r.rot),norm(target))<8}
function lockState(l){if(l.released)return 2;const A=rings[l.a],B=rings[l.b],am=aligned(A,l.aa),bm=aligned(B,l.ba);return am&&bm?2:(am||bm?1:0)}

function checkLocks(){
 let opened=false;
 for(const l of locks){
  if(l.released)continue;
  if(lockState(l)===2){l.released=true;l.anim=1;l.flash=1;opened=true;chime(720);rings[l.a].pulse=rings[l.b].pulse=1;}
 }
 if(opened){
  toast('金扣已解');
  setTimeout(()=>{if(locks.every(l=>l.released)){done=true;ui.result.textContent=`${moves} 步 · ${formatTime((Date.now()-start)/1000)}`;ui.complete.classList.remove('hidden');chime(920)}},460);
 }
}

function drawBackground(){
 const t=performance.now()/1000;
 let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102b2a');g.addColorStop(.55,'#173b38');g.addColorStop(1,'#0b211f');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // 月晕
 g=ctx.createRadialGradient(W*.79,H*.13,2,W*.79,H*.13,Math.min(W,H)*.34);g.addColorStop(0,'rgba(246,226,169,.25)');g.addColorStop(.28,'rgba(230,208,155,.08)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#ead9a6';ctx.shadowColor='rgba(248,226,168,.45)';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(W*.8,H*.13,Math.min(W,H)*.052,0,Math.PI*2);ctx.fill();ctx.restore();
 // 远山
 ctx.save();ctx.globalAlpha=.42;ctx.fillStyle='#0a1c1b';ctx.beginPath();ctx.moveTo(0,H*.31);ctx.bezierCurveTo(W*.15,H*.21,W*.27,H*.34,W*.41,H*.23);ctx.bezierCurveTo(W*.57,H*.14,W*.69,H*.33,W*.83,H*.23);ctx.bezierCurveTo(W*.92,H*.18,W,H*.27,W,H*.25);ctx.lineTo(W,H*.43);ctx.lineTo(0,H*.43);ctx.closePath();ctx.fill();ctx.restore();
 // 水纹与薄雾
 ctx.save();ctx.strokeStyle='rgba(206,224,204,.10)';ctx.lineWidth=1;for(let i=0;i<8;i++){const y=H*(.36+i*.075);ctx.beginPath();ctx.moveTo(-20,y);ctx.bezierCurveTo(W*.28,y-7+Math.sin(t*.35+i)*2,W*.67,y+7,W+20,y);ctx.stroke()}ctx.restore();
 const fog=ctx.createLinearGradient(0,H*.43,W,H*.58);fog.addColorStop(0,'rgba(230,238,222,0)');fog.addColorStop(.5,'rgba(230,238,222,.07)');fog.addColorStop(1,'rgba(230,238,222,0)');ctx.save();ctx.translate(Math.sin(t*.18)*24,0);ctx.fillStyle=fog;ctx.fillRect(-30,H*.4,W+60,H*.23);ctx.restore();
 // 荷叶剪影
 ctx.save();ctx.globalAlpha=.38;ctx.fillStyle='#0a2823';for(const [x,y,rx,ry,a] of [[.13,.88,.14,.045,-.15],[.82,.82,.17,.05,.12],[.69,.94,.12,.037,-.05],[.27,.96,.15,.043,.08]]){ctx.beginPath();ctx.ellipse(W*x,H*y,W*rx,H*ry,a,0,Math.PI*2);ctx.fill()}ctx.restore();
 // 暗纹
 ctx.save();ctx.globalAlpha=.07;ctx.strokeStyle='#d8c89d';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(W*.08+i*W*.22,H*.9,58+i*7,Math.PI*1.05,Math.PI*1.9);ctx.stroke()}ctx.restore();
}

function drawRing(r){
 ctx.save();ctx.lineCap='round';
 const startA=r.rot+r.gap/2,endA=r.rot+360-r.gap/2,start=rad(startA),end=rad(endA);
 // 外部投影
 ctx.shadowColor='rgba(0,0,0,.34)';ctx.shadowBlur=15;ctx.shadowOffsetY=7;ctx.lineWidth=r.width+5;ctx.strokeStyle='rgba(8,18,17,.30)';ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();
 // 玉体
 const grad=ctx.createLinearGradient(r.x-r.r,r.y-r.r,r.x+r.r,r.y+r.r);
 grad.addColorStop(0,'rgba(250,255,250,.94)');grad.addColorStop(.18,r.color);grad.addColorStop(.48,shade(r.color,-12));grad.addColorStop(.72,r.color);grad.addColorStop(1,'rgba(239,249,239,.88)');
 ctx.shadowBlur=0;ctx.lineWidth=r.width;ctx.strokeStyle=grad;ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();
 // 内外缘透光
 ctx.globalAlpha=.65;ctx.lineWidth=Math.max(2,r.width*.14);ctx.strokeStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.arc(r.x-r.width*.12,r.y-r.width*.12,r.r,start+.12,end-.12);ctx.stroke();
 ctx.globalAlpha=.22;ctx.lineWidth=Math.max(2,r.width*.13);ctx.strokeStyle='rgba(20,65,55,.55)';ctx.beginPath();ctx.arc(r.x+r.width*.12,r.y+r.width*.12,r.r,start+.1,end-.1);ctx.stroke();
 // 细微玉絮纹理
 ctx.globalAlpha=.13;for(let i=0;i<8;i++){const a=start+(end-start)*(i/8)+Math.sin(i*2.2)*.06,p=ringPoint(r,a*180/Math.PI);ctx.fillStyle=i%2?'#fff':'#5c826f';ctx.beginPath();ctx.ellipse(p.x,p.y,r.width*.42,r.width*.10,a+.35,0,Math.PI*2);ctx.fill()}
 // 缺口端面
 drawEndCap(r,startA,true);drawEndCap(r,endA,false);
 if(r.pulse>0){ctx.globalAlpha=r.pulse*.6;ctx.shadowColor='#ffe8a0';ctx.shadowBlur=28;ctx.lineWidth=r.width+6;ctx.strokeStyle='#fff1b8';ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();r.pulse=Math.max(0,r.pulse-.035)}
 ctx.restore();
}

function drawEndCap(r,a){
 const p=ringPoint(r,a),t=rad(a),tx=-Math.sin(t),ty=Math.cos(t);
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t+Math.PI/2);ctx.globalAlpha=.8;const g=ctx.createLinearGradient(-r.width/2,0,r.width/2,0);g.addColorStop(0,'rgba(255,255,255,.92)');g.addColorStop(.5,r.color);g.addColorStop(1,'rgba(67,99,86,.46)');ctx.fillStyle=g;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,r.width*.5,r.width*.22,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}

function shade(hex,amt){
 const n=parseInt(hex.replace('#',''),16),r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return`rgb(${r},${g},${b})`;
}

function lockGeometry(l){
 const A=rings[l.a],B=rings[l.b];
 const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
 // 取两个环朝向彼此的圆周点，再取中点，金扣不会漂到环中心。
 const pa={x:A.x+ux*A.r,y:A.y+uy*A.r},pb={x:B.x-ux*B.r,y:B.y-uy*B.r};
 const x=(pa.x+pb.x)/2,y=(pa.y+pb.y)/2;
 return{x,y,ang:Math.atan2(dy,dx)+Math.PI/2,w:Math.max(30,Math.min(A.width,B.width)*2.35),h:Math.max(17,Math.min(A.width,B.width)*1.22)};
}

function drawLockBack(l){
 if(l.released&&l.anim<=0)return;const p=lockGeometry(l),drop=l.released?(1-l.anim)*76:0;
 ctx.save();ctx.translate(p.x,p.y+drop);ctx.rotate(p.ang);ctx.globalAlpha=l.released?l.anim:1;ctx.shadowColor='rgba(0,0,0,.38)';ctx.shadowBlur=9;ctx.shadowOffsetY=4;ctx.fillStyle='#6c431f';roundRect(-p.w/2,-p.h/2,p.w,p.h,5);ctx.fill();ctx.restore();
}

function drawLockFront(l){
 if(l.released&&l.anim<=0)return;const p=lockGeometry(l),drop=l.released?(1-l.anim)*76:0,st=lockState(l);
 ctx.save();ctx.translate(p.x,p.y+drop);ctx.rotate(p.ang);ctx.globalAlpha=l.released?l.anim:1;
 const g=ctx.createLinearGradient(-p.w/2,0,p.w/2,0);g.addColorStop(0,'#6f421d');g.addColorStop(.18,'#c58a35');g.addColorStop(.42,st===2?'#fff0a4':'#e5b760');g.addColorStop(.58,'#f9dc83');g.addColorStop(.82,'#b87528');g.addColorStop(1,'#5e3517');
 ctx.fillStyle=g;ctx.strokeStyle='rgba(74,38,13,.86)';ctx.lineWidth=1.2;roundRect(-p.w/2,-p.h*.42,p.w,p.h*.84,5);ctx.fill();ctx.stroke();
 // 中央束带与高光，形成真正的金属扣，而不是两块浮空金片。
 ctx.fillStyle='rgba(91,48,17,.32)';roundRect(-p.w*.09,-p.h*.49,p.w*.18,p.h*.98,2);ctx.fill();
 ctx.strokeStyle='rgba(255,239,170,.78)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-p.w*.34,-p.h*.18);ctx.lineTo(p.w*.34,-p.h*.18);ctx.stroke();
 if(st===1&&!l.released){ctx.strokeStyle='rgba(255,214,105,.7)';ctx.lineWidth=2;ctx.strokeRect(-p.w/2-2,-p.h*.42-2,p.w+4,p.h*.84+4)}
 ctx.restore();if(l.released)l.anim=Math.max(0,l.anim-.025);
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}

function render(){drawBackground();for(const l of locks)drawLockBack(l);for(const r of rings)drawRing(r);for(const l of locks)drawLockFront(l);raf=requestAnimationFrame(render)}

function pick(x,y){let best=null,bd=1e9;for(const r of rings){const d=Math.abs(Math.hypot(x-r.x,y-r.y)-r.r);if(d<r.width*1.9&&d<bd){best=r;bd=d}}return best}
function pos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
function down(e){if(done)return;e.preventDefault();const p=pos(e);selected=pick(p.x,p.y);if(selected){lastAngle=Math.atan2(p.y-selected.y,p.x-selected.x);canvas.setPointerCapture?.(e.pointerId)}}
function move(e){if(!selected)return;e.preventDefault();const p=pos(e),a=Math.atan2(p.y-selected.y,p.x-selected.x),d=(a-lastAngle)*180/Math.PI;selected.rot=norm(selected.rot+d);lastAngle=a}
function up(e){if(!selected)return;e.preventDefault();moves++;ui.moves.textContent=String(moves);selected=null;checkLocks()}
canvas.addEventListener('pointerdown',down,{passive:false});canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',up,{passive:false});canvas.addEventListener('pointercancel',up,{passive:false});

function toast(t){ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),900)}
function formatTime(s){s=Math.floor(s);return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
setInterval(()=>{if(!done)ui.time.textContent=formatTime((Date.now()-start)/1000)},500);
let ac;function chime(freq){if(!soundOn)return;ac??=new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ac.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.72,ac.currentTime+.45);g.gain.setValueAtTime(.0001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.09,ac.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.55);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.58)}
$('#resetBtn').onclick=()=>load(levelIndex);$('#nextBtn').onclick=()=>load(levelIndex+1);$('#soundBtn').onclick=e=>{soundOn=!soundOn;e.target.textContent=`叮当：${soundOn?'开':'关'}`};$('#musicBtn').onclick=async e=>{musicOn=!musicOn;ui.bgm.volume=.28;if(musicOn){try{await ui.bgm.play()}catch{musicOn=false;toast('请再次点击开启音乐')}}else ui.bgm.pause();e.target.textContent=`音乐：${musicOn?'开':'关'}`};
window.addEventListener('resize',resize);resize();render();
})();
