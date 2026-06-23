import * as THREE from "three";

// A soft glowing aim beam from the weapon's barrel to whatever the crosshair is pointing at.
// Generic: the caller supplies the targets to test against and decides when to show/hide it.
export class LaserSight {
  constructor(scene, camera) {
    this.camera = camera;
    this._ray = new THREE.Raycaster();
    this._dir = new THREE.Vector3();
    this._hit = new THREE.Vector3();
    this._origin = new THREE.Vector3();
    this._beamDir = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    const geo = new THREE.CylinderGeometry(0.018, 0.018, 1, 6, 1, true);
    geo.translate(0, 0.5, 0); // base at origin, extends +Y so length scales directly
    this.beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xff1a1a, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.beam.material.userData.outlineParameters = { visible: false };
    this.beam.frustumCulled = false; this.beam.visible = false;
    scene.add(this.beam);
  }

  hide() { this.beam.visible = false; }

  /** @param {THREE.Object3D[]} targets meshes/hitboxes the beam can land on */
  update(targets) {
    const dir = this._dir; this.camera.getWorldDirection(dir);
    this._ray.set(this.camera.position, dir);
    this._ray.far = 90;
    const hits = this._ray.intersectObjects(targets, true);
    if (hits.length) this._hit.copy(hits[0].point);
    else this._hit.copy(this.camera.position).addScaledVector(dir, 80);
    // start at the visible barrel tip — a point in front of the camera (the real muzzle node is
    // flipped behind the camera by the viewmodel's 180° rotation, so we don't use it here)
    const origin = this._origin.set(0.16, -0.14, -1.25);
    this.camera.localToWorld(origin);
    const len = origin.distanceTo(this._hit);
    this._beamDir.copy(this._hit).sub(origin).normalize();
    this.beam.position.copy(origin);
    this.beam.quaternion.setFromUnitVectors(this._up, this._beamDir);
    this.beam.scale.set(1, len, 1);
    this.beam.visible = true;
  }
}
