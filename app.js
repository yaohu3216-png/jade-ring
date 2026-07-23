import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LEVELS } from './levels.js';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,.1,100); camera.position.set(0,0,12);
const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.55,.65,.65); composer.addPass(bloom);

scene.add(new THREE.AmbientLight(0xffdce8,2.0));
const key=new THREE.DirectionalLight(0xfff2d2,5);key.position.set(-3,5,8);scene.add(key);
const rim=new THREE.PointLight(0xff76bf,28,14);rim.position.set(4,-1,5);scene.add(rim);
const cool=new THREE.PointLight(0xa7c8ff,12,12);cool.position.set(-4,-3,4);scene.add(cool);

const root=new THREE.Group();scene.add(root);
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
let current=0,ringMap=new Map(),locks=[],selected=null,lastX=0,totalDrag=0,soundOn=true,finished=false;

const ui={no:document.querySelector('#levelNo'),name:document.querySelector('#levelName'),toast:document.querySelector('#toast'),complete:document.querySelector('#complete'),completeTitle:document.querySelector('#completeTitle')};

function showToast(t){ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>ui.toast.classList.remove('show'),1400)}
function deg(n){return THREE.MathUtils.degToRad(n)}
function norm(a){a%=Math.PI*2;return a<0?a+Math.PI*2:a}
function angleDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))}

class ArcCurve extends THREE.Curve{
 constructor(radius,start,end){super();this.radius=radius;this.start=start;this.end=end}
 getPoint(t,target=new THREE.Vector3()){const a=this.start+(this.end-this.start)*t;return target.set(Math.cos(a)*this.radius,Math.sin(a)*this.radius,0)}
}

function crystalMaterial(seed=0){
 return new THREE.MeshPhysicalMaterial({
  color:new THREE.Color().setHSL(.94,.68,.74+seed*.018),
  roughness:.12,metalness:0,transmission:.74,thickness:1.3,ior:1.49,
  clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.92,
  attenuationColor:new THREE.Color(0xff7caf),attenuationDistance:2.6,
  emissive:new THREE.Color(0x4c0a2c),emissiveIntensity:.15,
  envMapIntensity:1.8
 });
}
function createRing(data,i){
 const gap=deg(52),center=deg(data.opening),start=center+gap/2,end=center+Math.PI*2-gap/2;
 const geo=new THREE.TubeGeometry(new ArcCurve(data.r,start,end),80,.17,18,false);
 const group=new THREE.Group();group.position.set(data.x,data.y,0);
 const mesh=new THREE.Mesh(geo,crystalMaterial(i));mesh.userData.ringId=data.id;group.add(mesh);
 // internal strawberry-crystal flecks
 const fleckGeo=new THREE.SphereGeometry(.026,7,7);const fleckMat=new THREE.MeshBasicMaterial({color:0xffc0dd,transparent:true,opacity:.7});
 for(let n=0;n<24;n++){const a=start+Math.random()*(end-start);const rr=data.r+(Math.random()-.5)*.17;const f=new THREE.Mesh(fleckGeo,fleckMat);f.position.set(Math.cos(a)*rr,Math.sin(a)*rr,(Math.random()-.5)*.16);group.add(f)}
 // polished cut ends
 const capGeo=new THREE.SphereGeometry(.19,24,16);[start,end].forEach(a=>{const cap=new THREE.Mesh(capGeo,crystalMaterial(i+.2));cap.scale.set(.86,1,1);cap.position.set(Math.cos(a)*data.r,Math.sin(a)*data.r,0);group.add(cap)});
 group.userData={...data,rotation:0,removed:false,mesh};return group;
}
function createLock(data,index){
 const g=new THREE.Group();g.position.set(data.x,data.y,.22);
 const gold=new THREE.MeshPhysicalMaterial({color:0xf3c05e,metalness:.92,roughness:.16,clearcoat:1,clearcoatRoughness:.08,emissive:0x4b2400,emissiveIntensity:.12});
 const body=new THREE.Mesh(new RoundedBoxGeometry(.5,.29,.24,5,.09),gold);g.add(body);
 const band1=new THREE.Mesh(new THREE.TorusGeometry(.17,.045,12,30,Math.PI),gold);band1.rotation.z=Math.PI/2;band1.position.x=-.22;g.add(band1);
 const band2=band1.clone();band2.position.x=.22;g.add(band2);
 const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.075,1),new THREE.MeshPhysicalMaterial({color:0xfff5d7,transmission:.7,roughness:.03,metalness:0,emissive:0xffd97d,emissiveIntensity:.65}));gem.position.z=.16;g.add(gem);
 g.userData={...data,index,unlocked:false};return g;
}
function makeBackdrop(){
 const plate=new THREE.Mesh(new RoundedBoxGeometry(7.0,8.1,.34,8,.4),new THREE.MeshPhysicalMaterial({color:0xf5b7cf,roughness:.24,metalness:.05,clearcoat:1,clearcoatRoughness:.08,transmission:.08}));plate.position.z=-.6;root.add(plate);
 const inner=new THREE.Mesh(new RoundedBoxGeometry(6.5,7.6,.15,8,.35),new THREE.MeshPhysicalMaterial({color:0xffe3ec,roughness:.38,clearcoat:.8,transparent:true,opacity:.72}));inner.position.z=-.38;root.add(inner);
 const petalGeo=new THREE.CircleGeometry(.09,8);const petalMat=new THREE.MeshBasicMaterial({color:0xffc0d3,transparent:true,opacity:.5,side:THREE.DoubleSide});
 for(let i=0;i<45;i++){const p=new THREE.Mesh(petalGeo,petalMat);p.position.set((Math.random()-.5)*7,(Math.random()-.5)*8,(Math.random()-.2)*.6);p.scale.set(1,2,1);p.rotation.z=Math.random()*Math.PI;root.add(p)}
}
function clearRoot(){while(root.children.length){const o=root.children.pop();o.traverse?.(x=>{x.geometry?.dispose?.();if(x.material){(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>m.dispose?.())}})}}
function loadLevel(index){
 current=(index+LEVELS.length)%LEVELS.length;finished=false;ui.complete.classList.add('hidden');clearRoot();ringMap=new Map();locks=[];makeBackdrop();
 const level=LEVELS[current];level.rings.forEach((r,i)=>{const obj=createRing(r,i);root.add(obj);ringMap.set(r.id,obj)});
 level.locks.forEach((l,i)=>{const obj=createLock(l,i);root.add(obj);locks.push(obj)});
 ui.no.textContent=`第 ${current+1} 关`;ui.name.textContent=level.name;updateLocks();
}
function activeOrder(){const pending=locks.filter(l=>!l.userData.unlocked);return pending.length?Math.min(...pending.map(l=>l.userData.order)):Infinity}
function updateLocks(){
 const order=activeOrder();locks.forEach(l=>{
  const active=!l.userData.unlocked&&l.userData.order===order;
  l.visible=!l.userData.unlocked;
  l.children.forEach(c=>{if(c.material){c.material.opacity=active?1:.5;c.material.transparent=!active;c.material.emissiveIntensity=active?.3:.03}});
  l.scale.setScalar(active?1.08:.96);
 });
 autoRemoveFreeRings();
}
function ringPendingLocks(id){return locks.filter(l=>!l.userData.unlocked&&(l.userData.guest===id||l.userData.host===id))}
function autoRemoveFreeRings(){
 let removedAny=false;
 for(const [id,r] of ringMap){
  if(r.userData.removed)continue;
  const everInPuzzle=locks.some(l=>l.userData.guest===id||l.userData.host===id);
  if(everInPuzzle&&ringPendingLocks(id).length===0){removeRing(r);removedAny=true}
 }
 if(removedAny)setTimeout(checkWin,450); else checkWin();
}
function removeRing(r){r.userData.removed=true;const start=performance.now(),base=r.scale.clone();function anim(now){const t=Math.min(1,(now-start)/480);r.rotation.z+=.025;r.scale.copy(base).multiplyScalar(1+.12*t);r.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=1-t}});if(t<1)requestAnimationFrame(anim);else{r.visible=false;playChime(760)}}requestAnimationFrame(anim)}
function checkWin(){if(finished)return;const visible=[...ringMap.values()].filter(r=>!r.userData.removed);if(locks.every(l=>l.userData.unlocked)&&visible.length===0){finished=true;ui.completeTitle.textContent=LEVELS[current].name;ui.complete.classList.remove('hidden');playChime(980)}}
function tryUnlock(ring,prevRot,newRot){
 const order=activeOrder();const candidate=locks.find(l=>!l.userData.unlocked&&l.userData.order===order&&(l.userData.guest===ring.userData.id));
 if(!candidate)return;
 const target=deg(candidate.userData.angle);const open0=norm(deg(ring.userData.opening)+prevRot),open1=norm(deg(ring.userData.opening)+newRot);
 const tol=deg(9);const crossed=angleDistance(open1,target)<tol && totalDrag>28;
 if(crossed){candidate.userData.unlocked=true;candidate.visible=false;playChime(620+order*45);showToast('金扣已解');updateLocks()}
}
function pick(e){const rect=canvas.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...ringMap.values()].filter(r=>!r.userData.removed),true);if(!hits.length)return null;let o=hits[0].object;while(o.parent&&o.parent!==root)o=o.parent;return o.userData?.id?o:null}
canvas.addEventListener('pointerdown',e=>{if(finished)return;selected=pick(e);lastX=e.clientX;totalDrag=0;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!selected)return;const dx=e.clientX-lastX;lastX=e.clientX;totalDrag+=Math.abs(dx);const prev=selected.rotation.z;selected.rotation.z+=dx*.012;selected.userData.rotation=selected.rotation.z;tryUnlock(selected,prev,selected.rotation.z)});
canvas.addEventListener('pointerup',e=>{selected=null;totalDrag=0;canvas.releasePointerCapture?.(e.pointerId)});
canvas.addEventListener('pointercancel',()=>{selected=null;totalDrag=0});

let audioCtx;function playChime(freq=720){if(!soundOn)return;audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime;[1,1.51,2.03].forEach((m,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=i?'sine':'triangle';o.frequency.setValueAtTime(freq*m,now);o.frequency.exponentialRampToValueAtTime(freq*m*.985,now+.9);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.055/(i+1),now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+1.1);o.connect(g).connect(audioCtx.destination);o.start(now);o.stop(now+1.15)})}

document.querySelector('#resetBtn').onclick=()=>loadLevel(current);
document.querySelector('#prevBtn').onclick=()=>loadLevel(current-1);
document.querySelector('#nextBtn').onclick=()=>loadLevel(current+1);
document.querySelector('#continueBtn').onclick=()=>loadLevel(current+1);
document.querySelector('#soundBtn').onclick=()=>{soundOn=!soundOn;document.querySelector('#soundBtn').textContent=soundOn?'音':'静'};
document.querySelector('#hintBtn').onclick=()=>{const o=activeOrder(),l=locks.find(x=>!x.userData.unlocked&&x.userData.order===o);if(!l)return;showToast(`先转动 ${l.userData.guest} 环，让缺口对准发光金扣`);const r=ringMap.get(l.userData.guest);r.children[0].material.emissiveIntensity=.8;setTimeout(()=>r.children[0].material.emissiveIntensity=.15,700)};

function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);composer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(canvas);
function animate(t){requestAnimationFrame(animate);root.children.forEach((o,i)=>{if(o.geometry?.type==='CircleGeometry')o.position.y+=Math.sin(t*.0005+i)*.0007});composer.render()}loadLevel(0);animate(0);
