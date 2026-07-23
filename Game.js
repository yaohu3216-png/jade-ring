import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Ring } from './Ring.js';
import { Clasp } from './Clasp.js';

export class Game {
  constructor({canvas,levels,onProgress,onComplete,onToast}){
    this.canvas=canvas;
    this.levels=levels;
    this.onProgress=onProgress;
    this.onComplete=onComplete;
    this.onToast=onToast;
    this.levelIndex=0;
    this.rings=new Map();
    this.clasps=[];
    this.selected=null;
    this.lastX=0;
    this.dragDistance=0;
    this.prevOpening=0;
    this.finished=false;
    this.soundEnabled=true;

    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.3;

    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(34,1,.1,100);
    this.camera.position.set(0,0,11.7);
    this.root=new THREE.Group();
    this.scene.add(this.root);

    this.composer=new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.72,.55,.72);
    this.composer.addPass(this.bloom);

    this.raycaster=new THREE.Raycaster();
    this.pointer=new THREE.Vector2();
    this.setupLights();
    this.bind();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    this.animate();
  }

  setupLights(){
    this.scene.add(new THREE.HemisphereLight(0xffe5f0,0x28101e,2.7));
    const key=new THREE.DirectionalLight(0xfff0d2,5.2);key.position.set(-4,6,7);this.scene.add(key);
    const rose=new THREE.PointLight(0xff68ae,34,14);rose.position.set(4,-1,5);this.scene.add(rose);
    const cool=new THREE.PointLight(0xa7d4ff,18,13);cool.position.set(-4,-3,5);this.scene.add(cool);
  }

  load(index){
    this.levelIndex=(index+this.levels.length)%this.levels.length;
    this.finished=false;
    this.clearRoot();
    this.rings=new Map();
    this.clasps=[];
    this.makeBackdrop();
    const level=this.levels[this.levelIndex];
    level.rings.forEach((data,i)=>{
      const ring=new Ring(data,i);
      this.root.add(ring);
      this.rings.set(data.id,ring);
    });
    level.clasps.forEach(data=>{
      const clasp=new Clasp(data);
      this.root.add(clasp);
      this.clasps.push(clasp);
    });
    this.refreshState();
    return level;
  }

  reset(){return this.load(this.levelIndex);}
  next(){return this.load(this.levelIndex+1);}
  previous(){return this.load(this.levelIndex-1);}
  getCurrentLevel(){return this.levels[this.levelIndex];}

  makeBackdrop(){
    const plateMat=new THREE.MeshPhysicalMaterial({color:0xef9fbe,roughness:.22,clearcoat:1,clearcoatRoughness:.04,transmission:.08});
    const plate=new THREE.Mesh(new RoundedBoxGeometry(6.7,7.95,.34,10,.42),plateMat);
    plate.position.z=-.72;
    this.root.add(plate);
    const inset=new THREE.Mesh(new RoundedBoxGeometry(6.25,7.48,.13,10,.34),new THREE.MeshPhysicalMaterial({color:0xffe5ee,roughness:.32,clearcoat:1,transparent:true,opacity:.78}));
    inset.position.z=-.5;
    this.root.add(inset);

    const halo=new THREE.Mesh(new THREE.CircleGeometry(2.5,72),new THREE.MeshBasicMaterial({color:0xfff0f4,transparent:true,opacity:.23}));
    halo.position.z=-.36;
    this.root.add(halo);

    const petalGeometry=new THREE.CircleGeometry(.055,8);
    const petalMaterial=new THREE.MeshBasicMaterial({color:0xffbbd3,transparent:true,opacity:.52,side:THREE.DoubleSide});
    for(let i=0;i<44;i++){
      const p=new THREE.Mesh(petalGeometry,petalMaterial);
      p.position.set((Math.random()-.5)*6.2,(Math.random()-.5)*7.2,-.25+Math.random()*.9);
      p.scale.set(.8,1.8,1);
      p.rotation.z=Math.random()*Math.PI;
      p.userData.petal=true;
      p.userData.speed=.0001+Math.random()*.00025;
      this.root.add(p);
    }
  }

  activeOrder(){
    const pending=this.clasps.filter(c=>!c.userData.unlocked);
    return pending.length?Math.min(...pending.map(c=>c.data.order)):Infinity;
  }

  refreshState(){
    const active=this.activeOrder();
    for(const clasp of this.clasps)clasp.setActive(clasp.data.order===active);
    for(const ring of this.rings.values())ring.setHighlighted(false);
    const current=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===active);
    if(current)this.rings.get(current.data.guest)?.setHighlighted(true);
    const solved=this.clasps.filter(c=>c.userData.unlocked).length;
    this.onProgress?.(solved,this.clasps.length);
    this.checkReleases();
  }

  checkReleases(){
    for(const ring of this.rings.values()){
      if(ring.userData.removed)continue;
      const guestLocks=this.clasps.filter(c=>c.data.guest===ring.data.id);
      const shouldRelease=guestLocks.length>0&&guestLocks.every(c=>c.userData.unlocked);
      if(shouldRelease)this.releaseRing(ring);
    }
    if(this.clasps.every(c=>c.userData.unlocked)){
      for(const ring of this.rings.values()){
        if(!ring.userData.removed)this.releaseRing(ring);
      }
    }
    this.checkWinSoon();
  }

  releaseRing(ring){
    ring.fadeOut(()=>{this.playChime(760);this.checkWinSoon();});
  }

  checkWinSoon(){
    clearTimeout(this.winTimer);
    this.winTimer=setTimeout(()=>{
      if(this.finished)return;
      const allClasps=this.clasps.every(c=>c.userData.unlocked);
      const allRings=[...this.rings.values()].every(r=>r.userData.removed);
      if(allClasps&&allRings){
        this.finished=true;
        this.playChime(1040);
        this.onComplete?.(this.getCurrentLevel());
      }
    },650);
  }

  tryUnlock(ring,previousOpening,currentOpening){
    const order=this.activeOrder();
    const clasp=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===order&&c.data.guest===ring.data.id);
    if(!clasp)return;
    const target=THREE.MathUtils.degToRad(clasp.data.angle);
    const crossed=angleCrossed(previousOpening,currentOpening,target);
    const aligned=angularDistance(currentOpening,target)<THREE.MathUtils.degToRad(7.5);
    if(this.dragDistance>34&&(crossed||aligned)){
      clasp.unlock();
      this.playChime(620+order*42);
      this.onToast?.('金扣已解');
      this.dragDistance=-9999;
      setTimeout(()=>this.refreshState(),310);
    }
  }

  hint(){
    const order=this.activeOrder();
    const clasp=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===order);
    if(!clasp)return;
    const ring=this.rings.get(clasp.data.guest);
    ring?.setHighlighted(true);
    this.onToast?.(`转动 ${clasp.data.guest} 环，使缺口经过发光金扣`);
    setTimeout(()=>this.refreshState(),900);
  }

  bind(){
    this.canvas.addEventListener('pointerdown',e=>{
      if(this.finished)return;
      this.selected=this.pick(e);
      if(!this.selected)return;
      this.lastX=e.clientX;
      this.dragDistance=0;
      this.prevOpening=this.selected.getOpeningAngle();
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove',e=>{
      if(!this.selected)return;
      const dx=e.clientX-this.lastX;
      this.lastX=e.clientX;
      this.dragDistance+=Math.abs(dx);
      const before=this.selected.getOpeningAngle();
      this.selected.rotation.z+=dx*.0105;
      const after=this.selected.getOpeningAngle();
      this.tryUnlock(this.selected,before,after);
    });
    const end=e=>{
      this.selected=null;
      this.dragDistance=0;
      if(e?.pointerId!==undefined)this.canvas.releasePointerCapture?.(e.pointerId);
    };
    this.canvas.addEventListener('pointerup',end);
    this.canvas.addEventListener('pointercancel',end);
  }

  pick(e){
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
    this.pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const targets=[];
    for(const ring of this.rings.values())if(!ring.userData.removed)targets.push(...ring.children);
    const hit=this.raycaster.intersectObjects(targets,true)[0];
    if(!hit)return null;
    return hit.object.userData.owner||hit.object.parent?.userData?.owner||null;
  }

  clearRoot(){
    while(this.root.children.length){
      const object=this.root.children.pop();
      object.traverse?.(node=>{
        node.geometry?.dispose?.();
        if(node.material){for(const material of (Array.isArray(node.material)?node.material:[node.material]))material.dispose?.();}
      });
    }
  }

  resize(){
    const rect=this.canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width,rect.height,false);
    this.composer.setSize(rect.width,rect.height);
    this.camera.aspect=rect.width/rect.height;
    this.camera.updateProjectionMatrix();
  }

  animate(){
    const loop=t=>{
      requestAnimationFrame(loop);
      for(const object of this.root.children){
        if(object.userData.petal){object.position.y+=Math.sin(t*.0007+object.position.x)*object.userData.speed;object.rotation.z+=object.userData.speed*.5;}
      }
      this.composer.render();
    };
    requestAnimationFrame(loop);
  }

  setSound(enabled){this.soundEnabled=enabled;}
  playChime(freq=720){
    if(!this.soundEnabled)return;
    this.audioContext??=new(window.AudioContext||window.webkitAudioContext)();
    const now=this.audioContext.currentTime;
    [1,1.49,2.04].forEach((multiple,index)=>{
      const oscillator=this.audioContext.createOscillator();
      const gain=this.audioContext.createGain();
      oscillator.type=index?'sine':'triangle';
      oscillator.frequency.setValueAtTime(freq*multiple,now);
      oscillator.frequency.exponentialRampToValueAtTime(freq*multiple*.987,now+1.05);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(.05/(index+1),now+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,now+1.15);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start(now);oscillator.stop(now+1.2);
    });
  }
}

function angularDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
function angleCrossed(a,b,target){
  const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const toTarget=Math.atan2(Math.sin(target-a),Math.cos(target-a));
  return delta>=0 ? toTarget>=0&&toTarget<=delta : toTarget<=0&&toTarget>=delta;
}
