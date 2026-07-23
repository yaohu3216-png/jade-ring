const cv=document.getElementById('c'),ctx=cv.getContext('2d');
function rs(){cv.width=cv.clientWidth*devicePixelRatio;cv.height=cv.clientHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);}
rs();addEventListener('resize',()=>location.reload());
let rot=0,vel=0,lastA=0,drag=false;
function pos(e){const r=cv.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left-r.width/2;
const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top-r.height/2;return Math.atan2(y,x);}
function start(e){drag=true;lastA=pos(e);}
function move(e){if(!drag)return;e.preventDefault();const a=pos(e);let d=a-lastA;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;rot+=d;vel=d;lastA=a;}
function end(){drag=false;}
cv.onpointerdown=start;window.onpointermove=move;window.onpointerup=end;
cv.addEventListener('touchstart',start,{passive:false});
cv.addEventListener('touchmove',move,{passive:false});
window.addEventListener('touchend',end);
let petals=[...Array(18)].map(()=>({x:Math.random(),y:Math.random(),s:2+Math.random()*4}));
function draw(){
const w=cv.clientWidth,h=cv.clientHeight;ctx.clearRect(0,0,w,h);
petals.forEach(p=>{p.y+=0.0008+Math.abs(vel)*0.02;p.x+=Math.sin(p.y*20)*0.0005;if(p.y>1){p.y=-.05;p.x=Math.random();}
ctx.save();ctx.translate(p.x*w,p.y*h);ctx.rotate(p.y*8);ctx.fillStyle='rgba(240,170,190,.8)';
ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*1.8,0,0,7);ctx.fill();ctx.restore();});
if(!drag){rot+=vel;vel*=0.985;}
ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rot);
let g=ctx.createRadialGradient(-30,-30,30,0,0,150);
g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#dff6e5');g.addColorStop(1,'#88b792');
ctx.strokeStyle=g;ctx.lineWidth=40;ctx.lineCap='round';
ctx.beginPath();ctx.arc(0,0,120,0,Math.PI*2);ctx.stroke();
ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=5;
ctx.beginPath();ctx.arc(-15,-15,120,-.9,.5);ctx.stroke();
ctx.restore();
requestAnimationFrame(draw);}
draw();
