(()=>{
'use strict';
const $=s=>document.querySelector(s), canvas=$('#game'), ctx=canvas.getContext('2d');
const ui={level:$('#levelText'),moves:$('#movesText'),time:$('#timeText'),subtitle:$('#subtitle'),toast:$('#toast'),complete:$('#complete'),result:$('#resultText'),bgm:$('#bgm')};
let levelIndex=0,rings=[],locks=[],selected=null,lastAngle=0,moves=0,start=Date.now(),done=false,soundOn=true,musicOn=false,dpr=1,W=0,H=0;
const norm=a=>((a%360)+360)%360, rad=d=>d*Math.PI/180, angleDiff=(a,b)=>Math.abs(((a-b+540)%360)-180);
function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);W=r.width;H=r.height;load(levelIndex,false)}
function load(i,resetClock=true){levelIndex=(i+YH_LEVELS.length)%YH_LEVELS.length;const L=YH_LEVELS[levelIndex],s=Math.min(W,H),cx=W/2,cy=H/2+4;
 rings=L.rings.map((r,id)=>({id,x:cx+r[0]*W,y:cy+r[1]*H,r:r[2]*s,rot:r[3],gap:42,width:Math.max(13,s*.028),color:L.palette[id%L.palette.length],released:false,pulse:0}));
 locks=L.locks.map((q,id)=>({id,a:q[0],b:q[1],aa:q[2],ba:q[3],released:false,anim:0}));
 moves=0;done=false;selected=null;if(resetClock)start=Date.now();ui.level.textContent=`${levelIndex+1} / ${YH_LEVELS.length}`;ui.moves.textContent='0';ui.subtitle.textContent=L.name+' · 缺口相见，方可解结';ui.complete.classList.add('hidden');render();}
function ringPoint(r,a){const t=rad(a);return{x:r.x+Math.cos(t)*r.r,y:r.y+Math.sin(t)*r.r}}
function aligned(r,target){return angleDiff(norm(r.rot),norm(target))<10}
function lockState(l){if(l.released)return 2;const A=rings[l.a],B=rings[l.b],am=aligned(A,l.aa),bm=aligned(B,l.ba);return am&&bm?2:(am||bm?1:0)}
function checkLocks(){let opened=false;for(const l of locks){if(l.released)continue;const st=lockState(l);if(st===2){l.released=true;l.anim=1;opened=true;chime(690);rings[l.a].pulse=rings[l.b].pulse=1}}
 if(opened){toast('金扣已松');setTimeout(()=>{if(locks.every(l=>l.released)){done=true;ui.result.textContent=`${moves} 步 · ${formatTime((Date.now()-start)/1000)}`;ui.complete.classList.remove('hidden');chime(880)}},420)} }
function drawBackground(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(255,252,250,.76)');g.addColorStop(1,'rgba(226,185,196,.48)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle='#a66c79';ctx.lineWidth=1;for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(W*.12+i*W*.14,H*.85+(i%2)*9,55+i*7,Math.PI*1.08,Math.PI*1.88);ctx.stroke()}ctx.restore()}
function drawRing(r){ctx.save();ctx.lineCap='round';const start=rad(r.rot+r.gap/2),end=rad(r.rot+360-r.gap/2);
 ctx.shadowColor='rgba(75,37,46,.22)';ctx.shadowBlur=12;ctx.shadowOffsetY=7;ctx.lineWidth=r.width+4;ctx.strokeStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();
 const grad=ctx.createLinearGradient(r.x-r.r,r.y-r.r,r.x+r.r,r.y+r.r);grad.addColorStop(0,'rgba(255,255,255,.94)');grad.addColorStop(.18,r.color);grad.addColorStop(.52,r.color);grad.addColorStop(.82,'rgba(255,255,255,.65)');grad.addColorStop(1,r.color);ctx.shadowBlur=0;ctx.lineWidth=r.width;ctx.strokeStyle=grad;ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();
 ctx.globalAlpha=.22;ctx.lineWidth=Math.max(2,r.width*.18);ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(r.x-r.width*.08,r.y-r.width*.08,r.r,start+.15,end-.15);ctx.stroke();
 for(let i=0;i<7;i++){const a=start+(end-start)*(i/7)+Math.sin(i*2.1)*.08,p=ringPoint(r,a*180/Math.PI);ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.ellipse(p.x,p.y,r.width*.46,r.width*.14,a,0,Math.PI*2);ctx.fill()}
 if(r.pulse>0){ctx.globalAlpha=r.pulse*.7;ctx.shadowColor='#fff7c2';ctx.shadowBlur=25;ctx.lineWidth=r.width+5;ctx.strokeStyle='#fff9da';ctx.beginPath();ctx.arc(r.x,r.y,r.r,start,end);ctx.stroke();r.pulse=Math.max(0,r.pulse-.035)}ctx.restore()}
function lockPosition(l){const A=rings[l.a],B=rings[l.b];return{x:(A.x+B.x)/2,y:(A.y+B.y)/2,ang:Math.atan2(B.y-A.y,B.x-A.x)}}
function drawLock(l,front){if(l.released&&l.anim<=0)return;const p=lockPosition(l),A=rings[l.a],w=Math.max(16,A.width*1.45),h=Math.max(10,A.width*.9);ctx.save();ctx.translate(p.x,p.y+(l.released?(1-l.anim)*70:0));ctx.rotate(p.ang);ctx.globalAlpha=l.released?l.anim:1;const st=lockState(l);const gold=st===2?'#fff0ad':st===1?'#e9b85d':'#bd8237';
 const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#7c481e');g.addColorStop(.28,gold);g.addColorStop(.52,'#fff0b1');g.addColorStop(.75,gold);g.addColorStop(1,'#6c3d1a');ctx.fillStyle=g;ctx.strokeStyle='rgba(95,51,18,.7)';ctx.lineWidth=1;
 ctx.beginPath();if(front){ctx.roundRect(-w/2,-h*.12,w,h*.62,3)}else{ctx.roundRect(-w/2,-h*.5,w,h*.55,3)}ctx.fill();ctx.stroke();if(front){ctx.globalAlpha*=.65;ctx.strokeStyle='#fff3b9';ctx.beginPath();ctx.moveTo(-w*.34,-h*.02);ctx.lineTo(w*.34,-h*.02);ctx.stroke()}ctx.restore();if(l.released)l.anim=Math.max(0,l.anim-.026)}
function render(){drawBackground();for(const l of locks)drawLock(l,false);for(const r of rings)drawRing(r);for(const l of locks)drawLock(l,true);requestAnimationFrame(render)}
function pick(x,y){let best=null,bd=1e9;for(const r of rings){const d=Math.abs(Math.hypot(x-r.x,y-r.y)-r.r);if(d<r.width*1.8&&d<bd){best=r;bd=d}}return best}
function pos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
function down(e){if(done)return;e.preventDefault();const p=pos(e);selected=pick(p.x,p.y);if(selected){lastAngle=Math.atan2(p.y-selected.y,p.x-selected.x);canvas.setPointerCapture?.(e.pointerId)}}
function move(e){if(!selected)return;e.preventDefault();const p=pos(e),a=Math.atan2(p.y-selected.y,p.x-selected.x),d=(a-lastAngle)*180/Math.PI;selected.rot=norm(selected.rot+d);lastAngle=a}
function up(e){if(!selected)return;e.preventDefault();moves++;ui.moves.textContent=String(moves);selected=null;checkLocks()}
canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
function toast(t){ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('show'),900)}
function formatTime(s){s=Math.floor(s);return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
setInterval(()=>{if(!done)ui.time.textContent=formatTime((Date.now()-start)/1000)},500);
let ac;function chime(freq){if(!soundOn)return;ac??=new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ac.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.72,ac.currentTime+.45);g.gain.setValueAtTime(.0001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.12,ac.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.55);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.58)}
$('#resetBtn').onclick=()=>load(levelIndex);$('#nextBtn').onclick=()=>load(levelIndex+1);$('#soundBtn').onclick=e=>{soundOn=!soundOn;e.target.textContent=`叮当：${soundOn?'开':'关'}`};$('#musicBtn').onclick=async e=>{musicOn=!musicOn;ui.bgm.volume=.28;if(musicOn){try{await ui.bgm.play()}catch{musicOn=false;toast('请再次点击开启音乐')}}else ui.bgm.pause();e.target.textContent=`音乐：${musicOn?'开':'关'}`};
window.addEventListener('resize',resize);resize();
})();
