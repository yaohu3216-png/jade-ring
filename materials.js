import * as THREE from 'three';

export function createCrystalMaterial(hue=.96, variant=0){
  const color = new THREE.Color().setHSL(hue, .72, .73 + variant*.015);
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness:.075,
    metalness:0,
    transmission:.9,
    thickness:1.9,
    ior:1.52,
    clearcoat:1,
    clearcoatRoughness:.035,
    transparent:true,
    opacity:.94,
    attenuationColor:new THREE.Color(0xff86b5),
    attenuationDistance:3.2,
    emissive:new THREE.Color(0x5a1233),
    emissiveIntensity:.10,
    envMapIntensity:2.2
  });
}

export function createGoldMaterial(){
  return new THREE.MeshPhysicalMaterial({
    color:0xf1bd59,
    metalness:.96,
    roughness:.12,
    clearcoat:1,
    clearcoatRoughness:.025,
    emissive:0x4b2100,
    emissiveIntensity:.12,
    envMapIntensity:2.4
  });
}
