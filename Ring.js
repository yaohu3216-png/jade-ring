import * as THREE from 'three';
import { createCrystalMaterial } from './materials.js';

class ArcCurve extends THREE.Curve {
  constructor(radius,start,end){super();this.radius=radius;this.start=start;this.end=end;}
  getPoint(t,target=new THREE.Vector3()){
    const a=this.start+(this.end-this.start)*t;
    return target.set(Math.cos(a)*this.radius,Math.sin(a)*this.radius,0);
  }
}

export class Ring extends THREE.Group {
  constructor(data,index){
    super();
    this.data=data;
    this.userData.kind='ring';
    this.userData.id=data.id;
    this.userData.removed=false;
    this.position.set(data.x,data.y,0);

    const gap=THREE.MathUtils.degToRad(50);
    const centre=THREE.MathUtils.degToRad(data.opening);
    const start=centre+gap/2;
    const end=centre+Math.PI*2-gap/2;
    this.openingBase=centre;

    const material=createCrystalMaterial(data.hue,index%3*.25);
    const geometry=new THREE.TubeGeometry(new ArcCurve(data.radius,start,end),120,.145,24,false);
    const body=new THREE.Mesh(geometry,material);
    body.userData.owner=this;
    this.body=body;
    this.add(body);

    const capGeometry=new THREE.SphereGeometry(.153,28,18);
    for(const a of [start,end]){
      const cap=new THREE.Mesh(capGeometry,createCrystalMaterial(data.hue,.25));
      cap.scale.set(.88,1,1);
      cap.position.set(Math.cos(a)*data.radius,Math.sin(a)*data.radius,0);
      cap.userData.owner=this;
      this.add(cap);
    }

    const inclusionGeometry=new THREE.SphereGeometry(.018,6,6);
    const inclusionMaterial=new THREE.MeshBasicMaterial({color:0xffb3d3,transparent:true,opacity:.58});
    const rng=mulberry32(index*9203+data.id.charCodeAt(0)*41);
    for(let i=0;i<34;i++){
      const a=start+rng()*(end-start);
      const radial=data.radius+(rng()-.5)*.14;
      const fleck=new THREE.Mesh(inclusionGeometry,inclusionMaterial);
      fleck.position.set(Math.cos(a)*radial,Math.sin(a)*radial,(rng()-.5)*.13);
      fleck.scale.setScalar(.55+rng()*1.3);
      fleck.userData.owner=this;
      this.add(fleck);
    }
  }

  getOpeningAngle(){
    return normalize(this.openingBase+this.rotation.z);
  }

  setHighlighted(active){
    this.body.material.emissiveIntensity=active?.38:.10;
  }

  fadeOut(onDone){
    if(this.userData.removed)return;
    this.userData.removed=true;
    const start=performance.now();
    const animate=(now)=>{
      const t=Math.min(1,(now-start)/560);
      const eased=1-Math.pow(1-t,3);
      this.rotation.z+=.022;
      this.position.z=eased*.55;
      this.scale.setScalar(1+.18*eased);
      this.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=1-eased;}});
      if(t<1)requestAnimationFrame(animate);else{this.visible=false;onDone?.();}
    };
    requestAnimationFrame(animate);
  }
}

function normalize(a){
  a%=Math.PI*2;
  return a<0?a+Math.PI*2:a;
}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
