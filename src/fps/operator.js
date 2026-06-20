import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

// The player operator (black SWAT) — used for the intro insertion (third-person).
let _asset = null;
let _loading = null;
export function preloadOperator() {
  if (_asset) return Promise.resolve();
  if (_loading) return _loading;
  const loader = new GLTFLoader();
  _loading = new Promise((resolve) => {
    loader.load("/models/SWAT.glb", (gltf) => {
      const bbox = new THREE.Box3().setFromObject(gltf.scene);
      const h = bbox.max.y - bbox.min.y || 1;
      _asset = { scene: gltf.scene, animations: gltf.animations, scale: 1.8 / h };
      resolve();
    }, undefined, () => resolve()); // resolve even on failure so boot never hangs
  });
  return _loading;
}

export function makeOperator() {
  if (!_asset) return null;
  const model = skeletonClone(_asset.scene);
  model.scale.setScalar(_asset.scale);
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const bones = {};
  model.traverse((o) => {
    if (o.name === "UpperArmR") bones.rArm = o;
    else if (o.name === "UpperArmL") bones.lArm = o;
    else if (o.name === "LowerArmR") bones.rFore = o;
    else if (o.name === "LowerArmL") bones.lFore = o;
    else if (o.name === "WristR") bones.rWrist = o;
    else if (o.name === "UpperLegL") bones.lUpLeg = o;
    else if (o.name === "UpperLegR") bones.rUpLeg = o;
  });
  return { model, bones };
}
