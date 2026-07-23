import * as THREE from './three.module.min.js';
import { CHAPTER, LEVELS } from './levels.js';

const $ = (s) => document.querySelector(s);
const ui = {
  canvas: $('#scene'),
  boot: $('#bootMessage'),
  chapter: $('#chapterName'),
  level: $('#levelName'),
  levelCounter: $('#levelCounter'),
  progress: $('#progressText'),
  moves: $('#moveCount'),
  toast: $('#toast'),
  levelDialog: $('#levelDialog'),
  levelGrid: $('#levelGrid'),
  completeDialog: $('#completeDialog'),
  completeText: $('#completeText'),
  bgm: $('#bgm')
};

function toast(message){
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove('show'), 1250);
}

class ArcCurve extends THREE.Curve {
  constructor(radius,start,end){ super(); this.radius=radius; this.start=start; this.end=end; }
  getPoint(t,target=new THREE.Vector3()){
    const a=this.start+(this.end-this.start)*t;
    return target.set(Math.cos(a)*this.radius,Math.sin(a)*this.radius,0);
  }
}

class JewelRing extends THREE.Group {
  constructor(data,index){
    super();
    this.data=data;
    this.userData.kind='ring';
    this.userData.owner=this;
    this.userData.removed=false;
    this.position.set(data.x,data.y,data.z||0);
    this.openingBase=THREE.MathUtils.degToRad(data.opening);
    this.tubeRadius=.185;
    this.gap=THREE.MathUtils.degToRad(48);
    const start=this.openingBase+this.gap/2;
    const end=this.openingBase+Math.PI*2-this.gap/2;
    this.arcStart=start; this.arcEnd=end;

    const mainMat=new THREE.MeshPhysicalMaterial({
      color:0xffb7cb,
      roughness:.115,
      metalness:0,
      transmission:.88,
      thickness:1.65,
      ior:1.53,
      clearcoat:1,
      clearcoatRoughness:.025,
      transparent:true,
      opacity:.91,
      attenuationColor:new THREE.Color(0xff7aa6),
      attenuationDistance:3.0,
      emissive:new THREE.Color(0x3b0a22),
      emissiveIntensity:.065,
      side:THREE.DoubleSide
    });
    const coreMat=new THREE.MeshPhysicalMaterial({
      color:0xffeef3,
      roughness:.22,
      transmission:.72,
      thickness:.9,
      transparent:true,
      opacity:.26,
      emissive:0x63203f,
      emissiveIntensity:.045
    });
    const curve=new ArcCurve(data.radius,start,end);
    const geom=new THREE.TubeGeometry(curve,180,this.tubeRadius,30,false);
    this.body=new THREE.Mesh(geom,mainMat);
    this.body.userData.owner=this;
    this.add(this.body);

    const coreGeom=new THREE.TubeGeometry(curve,180,this.tubeRadius*.68,22,false);
    const core=new THREE.Mesh(coreGeom,coreMat);
    core.userData.owner=this;
    this.add(core);

    const shadowMat=new THREE.MeshBasicMaterial({color:0x1a0813,transparent:true,opacity:.28,depthWrite:false});
    const shadow=new THREE.Mesh(geom.clone(),shadowMat);
    shadow.position.set(.035,-.055,-.16);
    shadow.scale.setScalar(1.01);
    shadow.userData.owner=this;
    this.add(shadow);

    const highlightMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending});
    const hStart=start+.24;
    const hEnd=Math.min(end-.5,hStart+Math.PI*.82);
    const hCurve=new ArcCurve(data.radius+.055,hStart,hEnd);
    const hGeom=new THREE.TubeGeometry(hCurve,70,.027,10,false);
    const highlight=new THREE.Mesh(hGeom,highlightMat);
    highlight.position.z=.12;
    highlight.userData.owner=this;
    this.add(highlight);

    this.makeCaps(start,end,mainMat);
    this.makeInclusions(index);
  }

  makeCaps(start,end,material){
    const capGeom=new THREE.CylinderGeometry(this.tubeRadius*1.01,this.tubeRadius*1.01,.105,40,1,false);
    for(const a of [start,end]){
      const cap=new THREE.Mesh(capGeom,material.clone());
      cap.position.set(Math.cos(a)*this.data.radius,Math.sin(a)*this.data.radius,0);
      cap.rotation.z=a;
      cap.userData.owner=this;
      this.add(cap);
      const face=new THREE.Mesh(new THREE.CircleGeometry(this.tubeRadius*.83,36),new THREE.MeshPhysicalMaterial({color:0xffdce8,roughness:.2,transmission:.38,transparent:true,opacity:.83,emissive:0x7a2348,emissiveIntensity:.08,side:THREE.DoubleSide}));
      face.position.copy(cap.position);
      face.position.z=.06;
      face.rotation.z=a;
      face.userData.owner=this;
      this.add(face);
    }
  }

  makeInclusions(index){
    const rng=mulberry32((this.data.seed||index*1009)+31);
    const fleckMat=new THREE.MeshBasicMaterial({color:0xc62c64,transparent:true,opacity:.43,depthWrite:false});
    const goldMat=new THREE.MeshBasicMaterial({color:0xffd5a2,transparent:true,opacity:.55,depthWrite:false});
    const sphere=new THREE.SphereGeometry(.018,7,7);
    for(let i=0;i<52;i++){
      const a=this.arcStart+rng()*(this.arcEnd-this.arcStart);
      const radial=this.data.radius+(rng()-.5)*.22;
      const fleck=new THREE.Mesh(sphere,rng()>.87?goldMat:fleckMat);
      fleck.position.set(Math.cos(a)*radial,Math.sin(a)*radial,(rng()-.5)*.19);
      fleck.scale.setScalar(.55+rng()*1.5);
      fleck.userData.owner=this;
      this.add(fleck);
    }
  }

  getOpeningWorld(){ return normalize(this.openingBase+this.rotation.z); }
  setSelected(active){
    this.body.material.emissiveIntensity=active?.23:.065;
    this.scale.setScalar(active?1.025:1);
  }
  dissolve(onDone){
    if(this.userData.removed)return;
    this.userData.removed=true;
    const start=performance.now();
    const animate=(now)=>{
      const t=Math.min(1,(now-start)/620);
      const e=1-Math.pow(1-t,3);
      this.rotation.z+=.018;
      this.position.z=(this.data.z||0)+e*.8;
      this.scale.setScalar(1+.15*e);
      this.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=Math.max(0,1-e);}});
      if(t<1)requestAnimationFrame(animate);else{this.visible=false;onDone?.();}
    };
    requestAnimationFrame(animate);
  }
}

class JewelClasp extends THREE.Group {
  constructor(data){
    super();
    this.data=data;
    this.userData.kind='clasp';
    this.userData.unlocked=false;
    this.position.set(data.x,data.y,.32);
    this.rotation.z=THREE.MathUtils.degToRad(data.tilt||0);
    const gold=new THREE.MeshPhysicalMaterial({color:0xffc85e,metalness:.52,roughness:.20,clearcoat:1,clearcoatRoughness:.03,emissive:0x7a3700,emissiveIntensity:.24});
    const darkGold=new THREE.MeshPhysicalMaterial({color:0xb76b1c,metalness:.46,roughness:.27,emissive:0x4b2100,emissiveIntensity:.12});

    const back=new THREE.Mesh(new THREE.BoxGeometry(.58,.36,.18),darkGold);
    back.position.z=-.07; back.scale.set(.96,.96,1); this.add(back);
    const body=new THREE.Mesh(roundedBoxGeometry(.58,.36,.25,.085),gold);
    this.body=body; this.add(body);
    const bandMat=gold.clone(); bandMat.color.set(0xffe09a); bandMat.emissive.set(0x8b4a00); bandMat.emissiveIntensity=.28;
    for(const x of [-.21,.21]){
      const band=new THREE.Mesh(roundedBoxGeometry(.055,.33,.275,.025),bandMat);
      band.position.set(x,0,.02); this.add(band);
    }
    if(data.diamond){
      const bezel=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.055,30),gold);
      bezel.rotation.x=Math.PI/2; bezel.position.z=.16; this.add(bezel);
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.055,2),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.01,transmission:.82,thickness:.5,clearcoat:1,emissive:0xffd98f,emissiveIntensity:.75}));
      gem.position.z=.205; this.add(gem);
    }
  }
  setActive(active){
    if(this.userData.unlocked)return;
    this.scale.setScalar(active?1.07:.99);
    this.traverse(o=>{
      if(!o.material)return;
      o.material.transparent=true;
      o.material.opacity=active?1:.82;
      if('emissiveIntensity' in o.material)o.material.emissiveIntensity=active?.42:.18;
    });
  }
  unlock(onDone){
    if(this.userData.unlocked)return;
    this.userData.unlocked=true;
    const start=performance.now();
    const animate=(now)=>{
      const t=Math.min(1,(now-start)/320);
      const e=1-Math.pow(1-t,3);
      this.position.z=.32+e*.45;
      this.rotation.z+=.018;
      this.scale.setScalar(1+.12*e);
      this.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=1-e;}});
      if(t<1)requestAnimationFrame(animate);else{this.visible=false;onDone?.();}
    };
    requestAnimationFrame(animate);
  }
}

class Game {
  constructor(canvas){
    this.canvas=canvas;
    this.levelIndex=0;
    this.rings=new Map();
    this.clasps=[];
    this.selected=null;
    this.prevPointerAngle=0;
    this.rotationTravel=0;
    this.unlockedThisGesture=false;
    this.moves=0;
    this.finished=false;
    this.soundEnabled=true;
    this.scene=new THREE.Scene();
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.28;
    this.camera=new THREE.OrthographicCamera(-3.8,3.8,4.55,-4.55,.1,50);
    this.camera.position.set(0,0,12);
    this.root=new THREE.Group();
    this.scene.add(this.root);
    this.raycaster=new THREE.Raycaster();
    this.pointer=new THREE.Vector2();
    this.plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
    this.tmpWorld=new THREE.Vector3();
    this.setupLights();
    this.bind();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas);
    window.visualViewport?.addEventListener('resize',()=>this.resize());
    this.animate();
  }

  setupLights(){
    this.scene.add(new THREE.HemisphereLight(0xfff0f4,0x260e1d,3.2));
    const key=new THREE.DirectionalLight(0xffefd7,5.3); key.position.set(-3.8,5.7,8); this.scene.add(key);
    const pink=new THREE.PointLight(0xff4f9e,27,15); pink.position.set(4,-1,5); this.scene.add(pink);
    const cool=new THREE.PointLight(0xb9dcff,17,14); cool.position.set(-4,-3,5); this.scene.add(cool);
    const rim=new THREE.PointLight(0xffe4a0,22,12); rim.position.set(0,4,4); this.scene.add(rim);
  }

  load(index){
    this.levelIndex=(index+LEVELS.length)%LEVELS.length;
    this.finished=false; this.moves=0; ui.moves.textContent='0';
    this.clearRoot(); this.rings=new Map(); this.clasps=[];
    this.makeBoard();
    const level=LEVELS[this.levelIndex];
    level.rings.forEach((data,i)=>{
      const ring=new JewelRing(data,i);
      this.root.add(ring); this.rings.set(data.id,ring);
    });
    level.clasps.forEach(data=>{
      const clasp=new JewelClasp(data);
      this.root.add(clasp); this.clasps.push(clasp);
    });
    ui.level.textContent=level.name;
    ui.levelCounter.textContent=`${this.levelIndex+1} / ${LEVELS.length}`;
    this.refresh();
    return level;
  }

  makeBoard(){
    const texture=makeTrayTexture();
    const board=new THREE.Mesh(new THREE.PlaneGeometry(6.65,8.15),new THREE.MeshBasicMaterial({map:texture,transparent:false}));
    board.position.z=-.75; this.root.add(board);
    const sheen=new THREE.Mesh(new THREE.PlaneGeometry(6.33,7.83),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.07,roughness:.08,clearcoat:1,depthWrite:false}));
    sheen.position.z=-.55; this.root.add(sheen);
    const glow=new THREE.Mesh(new THREE.CircleGeometry(2.55,80),new THREE.MeshBasicMaterial({color:0xfff3f6,transparent:true,opacity:.18,depthWrite:false}));
    glow.position.set(0,.15,-.48); this.root.add(glow);
    const petalMat=new THREE.MeshBasicMaterial({color:0xffa9c6,transparent:true,opacity:.54,side:THREE.DoubleSide,depthWrite:false});
    const petalGeom=new THREE.CircleGeometry(.055,9);
    for(let i=0;i<36;i++){
      const p=new THREE.Mesh(petalGeom,petalMat);
      p.position.set((Math.random()-.5)*6.05,(Math.random()-.5)*7.5,-.36+Math.random()*.4);
      p.scale.set(.75,1.8,1); p.rotation.z=Math.random()*Math.PI;
      p.userData.petal=true; p.userData.speed=.00014+Math.random()*.00022;
      this.root.add(p);
    }
  }

  activeOrder(){
    const pending=this.clasps.filter(c=>!c.userData.unlocked);
    return pending.length?Math.min(...pending.map(c=>c.data.order)):Infinity;
  }

  refresh(){
    const active=this.activeOrder();
    this.clasps.forEach(c=>c.setActive(c.data.order===active));
    this.rings.forEach(r=>r.setSelected(false));
    const target=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===active);
    if(target)this.rings.get(target.data.guest)?.setSelected(true);
    const solved=this.clasps.filter(c=>c.userData.unlocked).length;
    ui.progress.textContent=`${solved} / ${this.clasps.length}`;
    this.releaseAvailable();
  }

  releaseAvailable(){
    for(const ring of this.rings.values()){
      if(ring.userData.removed)continue;
      const pendingRelated=this.clasps.some(c=>!c.userData.unlocked&&(c.data.host===ring.data.id||c.data.guest===ring.data.id));
      const hadGuest=this.clasps.some(c=>c.data.guest===ring.data.id);
      if(hadGuest&&!pendingRelated)this.releaseRing(ring);
    }
    if(this.clasps.every(c=>c.userData.unlocked)){
      for(const ring of this.rings.values())if(!ring.userData.removed)this.releaseRing(ring);
    }
    this.scheduleWinCheck();
  }

  releaseRing(ring){
    ring.dissolve(()=>{this.playJadeChime(760);this.scheduleWinCheck();});
  }

  scheduleWinCheck(){
    clearTimeout(this.winTimer);
    this.winTimer=setTimeout(()=>{
      if(this.finished)return;
      const allClasps=this.clasps.every(c=>c.userData.unlocked);
      const allRings=[...this.rings.values()].every(r=>r.userData.removed);
      if(allClasps&&allRings){
        this.finished=true; this.playJadeChime(1050,true);
        ui.completeText.textContent=LEVELS[this.levelIndex].name;
        ui.completeDialog.showModal();
      }
    },720);
  }

  tryUnlock(ring,before,after){
    if(this.unlockedThisGesture)return;
    const order=this.activeOrder();
    const clasp=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===order&&c.data.guest===ring.data.id);
    if(!clasp)return;
    const target=Math.atan2(clasp.position.y-ring.position.y,clasp.position.x-ring.position.x);
    const crossed=angleCrossed(before,after,target);
    const aligned=angularDistance(after,target)<THREE.MathUtils.degToRad(5.4);
    if(this.rotationTravel>.16&&(crossed||aligned)){
      this.unlockedThisGesture=true;
      clasp.unlock(()=>{this.playJadeChime(660+order*34);this.refresh();});
      toast('金扣已解');
    }
  }

  hint(){
    const order=this.activeOrder();
    const clasp=this.clasps.find(c=>!c.userData.unlocked&&c.data.order===order);
    if(!clasp)return;
    this.rings.get(clasp.data.guest)?.setSelected(true);
    clasp.setActive(true);
    toast(`转动 ${clasp.data.guest} 环，让缺口完整越过发光金扣`);
    setTimeout(()=>this.refresh(),1100);
  }

  bind(){
    this.canvas.addEventListener('pointerdown',e=>{
      if(this.finished)return;
      const ring=this.pickRing(e);
      if(!ring)return;
      this.selected=ring; this.selected.setSelected(true);
      const p=this.pointerOnPlane(e);
      this.prevPointerAngle=Math.atan2(p.y-ring.position.y,p.x-ring.position.x);
      this.rotationTravel=0; this.unlockedThisGesture=false;
      try{this.canvas.setPointerCapture(e.pointerId);}catch{}
    },{passive:false});
    this.canvas.addEventListener('pointermove',e=>{
      if(!this.selected)return;
      e.preventDefault();
      const p=this.pointerOnPlane(e);
      const a=Math.atan2(p.y-this.selected.position.y,p.x-this.selected.position.x);
      const delta=shortAngle(a-this.prevPointerAngle);
      if(Math.abs(delta)>.45){this.prevPointerAngle=a;return;}
      const before=this.selected.getOpeningWorld();
      this.selected.rotation.z+=delta;
      const after=this.selected.getOpeningWorld();
      this.rotationTravel+=Math.abs(delta);
      this.prevPointerAngle=a;
      this.tryUnlock(this.selected,before,after);
    },{passive:false});
    const end=e=>{
      if(this.selected){
        this.moves++; ui.moves.textContent=String(this.moves);
        this.selected.setSelected(false);
      }
      this.selected=null; this.rotationTravel=0; this.unlockedThisGesture=false;
      try{if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);}catch{}
    };
    this.canvas.addEventListener('pointerup',end,{passive:false});
    this.canvas.addEventListener('pointercancel',end,{passive:false});
  }

  pickRing(e){
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
    this.pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects([...this.rings.values()],true);
    return hits.find(h=>h.object.userData.owner&&!h.object.userData.owner.userData.removed)?.object.userData.owner||null;
  }

  pointerOnPlane(e){
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
    this.pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    this.raycaster.ray.intersectPlane(this.plane,this.tmpWorld);
    return this.tmpWorld;
  }

  resize(){
    const rect=this.canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    this.renderer.setSize(rect.width,rect.height,false);
    const aspect=rect.width/rect.height;
    const viewH=8.9;
    this.camera.top=viewH/2; this.camera.bottom=-viewH/2;
    this.camera.left=-viewH*aspect/2; this.camera.right=viewH*aspect/2;
    this.camera.updateProjectionMatrix();
  }

  clearRoot(){
    while(this.root.children.length){
      const node=this.root.children.pop();
      node.traverse?.(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());}});
    }
  }

  animate(){
    const loop=t=>{
      requestAnimationFrame(loop);
      for(const o of this.root.children){
        if(o.userData.petal){o.position.y+=Math.sin(t*.0007+o.position.x)*o.userData.speed;o.rotation.z+=o.userData.speed*.7;}
      }
      this.renderer.render(this.scene,this.camera);
    };
    requestAnimationFrame(loop);
  }

  playJadeChime(freq=720,final=false){
    if(!this.soundEnabled)return;
    this.audio??=new(window.AudioContext||window.webkitAudioContext)();
    if(this.audio.state==='suspended')this.audio.resume();
    const now=this.audio.currentTime;
    const notes=final?[1,1.25,1.5,2.02]:[1,1.48,2.08];
    notes.forEach((m,i)=>{
      const osc=this.audio.createOscillator();
      const gain=this.audio.createGain();
      const filter=this.audio.createBiquadFilter();
      osc.type=i===0?'triangle':'sine';
      osc.frequency.setValueAtTime(freq*m,now+i*.026);
      osc.frequency.exponentialRampToValueAtTime(freq*m*.992,now+.75);
      filter.type='highpass';filter.frequency.value=520;
      gain.gain.setValueAtTime(.0001,now+i*.026);
      gain.gain.exponentialRampToValueAtTime(.048/(i+1),now+.012+i*.026);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.78+i*.04);
      osc.connect(filter).connect(gain).connect(this.audio.destination);
      osc.start(now+i*.026);osc.stop(now+.86+i*.05);
    });
  }
}

function makeTrayTexture(){
  const c=document.createElement('canvas');c.width=1024;c.height=1280;
  const x=c.getContext('2d');
  const bg=x.createRadialGradient(512,520,40,512,600,650);
  bg.addColorStop(0,'#fff8fa');bg.addColorStop(.28,'#ffe2eb');bg.addColorStop(.63,'#eaa5bd');bg.addColorStop(1,'#8d4769');
  x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
  const vign=x.createRadialGradient(512,590,220,512,600,690);
  vign.addColorStop(0,'rgba(255,255,255,0)');vign.addColorStop(1,'rgba(78,22,52,.43)');x.fillStyle=vign;x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='rgba(255,222,156,.92)';x.lineWidth=13;roundRect(x,48,50,928,1178,74);x.stroke();
  x.strokeStyle='rgba(255,247,237,.65)';x.lineWidth=4;roundRect(x,70,73,884,1134,58);x.stroke();
  x.strokeStyle='rgba(255,255,255,.11)';x.lineWidth=3;
  for(let i=0;i<9;i++){const y=210+i*112;x.beginPath();x.moveTo(70,y);x.bezierCurveTo(300,y-15,700,y+15,955,y);x.stroke();}
  drawLotus(x,155,1090,1.05,'rgba(255,214,228,.28)');
  drawLotus(x,875,180,.78,'rgba(255,235,241,.2)');
  for(let i=0;i<70;i++){x.fillStyle=`rgba(255,245,250,${.1+Math.random()*.35})`;x.beginPath();x.arc(70+Math.random()*884,80+Math.random()*1110,1+Math.random()*3,0,Math.PI*2);x.fill();}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function drawLotus(ctx,cx,cy,s,color){ctx.save();ctx.translate(cx,cy);ctx.fillStyle=color;for(let i=0;i<10;i++){ctx.save();ctx.rotate(i*Math.PI/5);ctx.beginPath();ctx.ellipse(0,-38*s,15*s,48*s,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function roundedBoxGeometry(w,h,d,r){
  const s=new THREE.Shape();
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:10});
  g.translate(0,0,-d/2);return g;
}
function normalize(a){a%=Math.PI*2;return a<0?a+Math.PI*2:a;}
function shortAngle(a){return Math.atan2(Math.sin(a),Math.cos(a));}
function angularDistance(a,b){return Math.abs(shortAngle(a-b));}
function angleCrossed(a,b,target){const delta=shortAngle(b-a);const to=shortAngle(target-a);return delta>=0?to>=0&&to<=delta:to<=0&&to>=delta;}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

try{
  ui.chapter.textContent=CHAPTER.name;
  const game=new Game(ui.canvas);
  window.__YUHAN_GAME__=game;
  function buildLevelGrid(){
    ui.levelGrid.innerHTML='';
    LEVELS.forEach((level,index)=>{
      const b=document.createElement('button');b.className='level-card';b.innerHTML=`<b>第 ${index+1} 关</b><span>${level.name}</span>`;
      b.onclick=()=>{ui.levelDialog.close();game.load(index);history.replaceState(null,'',`#level-${index+1}`);};ui.levelGrid.append(b);
    });
  }
  buildLevelGrid();
  $('#resetBtn').onclick=()=>game.load(game.levelIndex);
  $('#hintBtn').onclick=()=>game.hint();
  $('#selectBtn').onclick=()=>ui.levelDialog.showModal();
  $('#prevBtn').onclick=()=>game.load(game.levelIndex-1);
  $('#replayBtn').onclick=()=>{ui.completeDialog.close();game.load(game.levelIndex);};
  $('#nextBtn').onclick=()=>{ui.completeDialog.close();game.load(game.levelIndex+1);};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  let sound=true;
  $('#soundBtn').onclick=async()=>{sound=!sound;game.soundEnabled=sound;$('#soundBtn').textContent=sound?'音':'静';if(sound){try{ui.bgm.volume=.18;await ui.bgm.play();}catch{}}else ui.bgm.pause();};
  const initial=Math.max(0,Math.min(LEVELS.length-1,(Number(location.hash.match(/\d+/)?.[0])||1)-1));
  game.load(initial);
  window.__YUHAN_READY__=true;
  requestAnimationFrame(()=>ui.boot.classList.add('hidden'));
}catch(error){
  ui.boot.classList.add('error');ui.boot.textContent='游戏初始化失败：'+(error?.message||'未知错误');console.error(error);
}
