import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createGoldMaterial } from './materials.js';

export class Clasp extends THREE.Group {
  constructor(data){
    super();
    this.data=data;
    this.userData.kind='clasp';
    this.userData.unlocked=false;
    this.position.set(data.x,data.y,.28);
    this.rotation.z=THREE.MathUtils.degToRad(data.tilt||0);

    const gold=createGoldMaterial();
    const body=new THREE.Mesh(new RoundedBoxGeometry(.48,.27,.24,6,.085),gold);
    this.body=body;
    this.add(body);

    const railGeometry=new THREE.TorusGeometry(.16,.036,14,40,Math.PI);
    for(const x of [-.22,.22]){
      const rail=new THREE.Mesh(railGeometry,gold);
      rail.position.x=x;
      rail.rotation.z=Math.PI/2;
      this.add(rail);
    }

    const bezel=new THREE.Mesh(new THREE.CylinderGeometry(.078,.078,.055,28),gold);
    bezel.rotation.x=Math.PI/2;
    bezel.position.z=.145;
    this.add(bezel);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.052,2),new THREE.MeshPhysicalMaterial({color:0xfff4da,transmission:.72,roughness:.02,clearcoat:1,emissive:0xffd879,emissiveIntensity:.7}));
    gem.position.z=.19;
    this.add(gem);
  }

  setActive(active){
    if(this.userData.unlocked)return;
    this.scale.setScalar(active?1.08:.98);
    this.traverse(o=>{
      if(!o.material)return;
      o.material.transparent=true;
      o.material.opacity=active?1:.68;
      if('emissiveIntensity' in o.material)o.material.emissiveIntensity=active?.36:.08;
    });
  }

  unlock(){
    this.userData.unlocked=true;
    const start=performance.now();
    const animate=(now)=>{
      const t=Math.min(1,(now-start)/300);
      this.scale.setScalar(1+.18*t);
      this.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=1-t;}});
      if(t<1)requestAnimationFrame(animate);else this.visible=false;
    };
    requestAnimationFrame(animate);
  }
}
