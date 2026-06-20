import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

// A reusable STATIC prop (no skeleton): load a GLB once, then clone instances scaled to a
// target real-world length and seated on the ground. For vehicles, barriers, etc.
export class PropAsset {
  constructor(url, { length = null, height = null } = {}) {
    this.url = url; this.length = length; this.height = height;
    this._asset = null; this._loading = null;
  }
  preload() {
    if (this._asset) return Promise.resolve();
    if (this._loading) return this._loading;
    const loader = new GLTFLoader();
    this._loading = new Promise((resolve) => {
      loader.load(this.url, (gltf) => {
        const root = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3(); bbox.getSize(size);
        let scale = 1;
        if (this.length) scale = this.length / Math.max(size.x, size.z);
        else if (this.height) scale = this.height / size.y;
        this._asset = { root, scale, minY: bbox.min.y };
        resolve();
      }, undefined, () => resolve());
    });
    return this._loading;
  }
  get ready() { return !!this._asset; }
  // returns a Group whose origin sits on the ground at its center (ready to place + rotate)
  make({ tint = null } = {}) {
    if (!this._asset) return new THREE.Group();
    const g = new THREE.Group();
    const m = this._asset.root.clone(true);
    m.scale.setScalar(this._asset.scale);
    m.position.y = -this._asset.minY * this._asset.scale;
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (tint) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(tint), 0.6); }
    });
    g.add(m);
    return g;
  }
}

// A reusable rigged-character asset: load a GLB once, then stamp out cloned instances
// (shared geometry/materials) scaled to a target height, with named bones cached.
// Used by every character type in the game (enemies, the player operator, etc.).
export class RiggedAsset {
  constructor(url, targetHeight = 1.8) {
    this.url = url;
    this.targetHeight = targetHeight;
    this._asset = null;     // { scene, animations, scale }
    this._loading = null;
  }

  // Load the GLB once. Resolves even on failure so boot never hangs.
  preload() {
    if (this._asset) return Promise.resolve();
    if (this._loading) return this._loading;
    const loader = new GLTFLoader();
    this._loading = new Promise((resolve) => {
      loader.load(this.url, (gltf) => {
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const h = (bbox.max.y - bbox.min.y) || 1;
        this._asset = { scene: gltf.scene, animations: gltf.animations, scale: this.targetHeight / h };
        resolve();
      }, undefined, () => resolve());
    });
    return this._loading;
  }

  get ready() { return !!this._asset; }

  // Clone an instance. boneMap = { alias: "BoneNodeName", ... } -> returns cached bones under each alias.
  // Returns { model, bones, animations, scale } or null if not loaded yet.
  make(boneMap = {}) {
    if (!this._asset) return null;
    const model = skeletonClone(this._asset.scene);
    model.scale.setScalar(this._asset.scale);
    const wanted = new Map(Object.entries(boneMap).map(([alias, node]) => [node, alias]));
    const bones = {};
    if (wanted.size) model.traverse((o) => { if (wanted.has(o.name)) bones[wanted.get(o.name)] = o; });
    return { model, bones, animations: this._asset.animations, scale: this._asset.scale };
  }
}
