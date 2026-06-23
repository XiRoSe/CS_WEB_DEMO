import * as THREE from "three";
import { noOutline } from "../engine/primitives.js";
import { makeOperator } from "./actors/operator.js";

// Third-person parachute insertion: you watch your operator drift down from the sky under a big
// colorful canopy, the camera orbiting, the canopy collapsing on landing — then it cuts to first-person.
// Same interface as Intro ({ start(), update(dt), done, dispose() }).
export class ParachuteIntro {
  constructor(scene, camera, spawn, groundY = 0) {
    this.scene = scene; this.camera = camera;
    this.spawn = new THREE.Vector3(spawn.x, groundY, spawn.z);
    this.t = 0; this.dur = 7.5; this.done = false; this.startY = 150;
    this.pos = new THREE.Vector3(spawn.x, this.startY, spawn.z);
    this.group = new THREE.Group(); this.scene.add(this.group);

    const op = makeOperator();
    if (op) {
      this.op = op.model; this.bones = op.bones; this.group.add(this.op);
      if (this.bones.rArm) this.bones.rArm.rotation.z = 1.25; // arms up gripping the risers
      if (this.bones.lArm) this.bones.lArm.rotation.z = -1.25;
    }

    // colorful canopy (alternating gores) + risers from the harness
    this.canopy = new THREE.Group(); this.canopy.position.y = 7;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const panel = new THREE.Mesh(
        new THREE.SphereGeometry(4.3, 5, 6, a, Math.PI / 5, 0, Math.PI / 2),
        noOutline(new THREE.MeshStandardMaterial({ color: i % 2 ? 0xff5a3c : 0xf2efe6, roughness: 0.85, side: THREE.DoubleSide })),
      );
      this.canopy.add(panel);
    }
    this.group.add(this.canopy);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.4, 4), noOutline(new THREE.MeshBasicMaterial({ color: 0x20242a })));
      r.position.set(Math.cos(a) * 2, 3.6, Math.sin(a) * 2);
      r.rotation.z = -Math.cos(a) * 0.34; r.rotation.x = Math.sin(a) * 0.34;
      this.group.add(r);
    }
    this._look = new THREE.Vector3();
  }

  start() {}

  update(dt) {
    this.t += dt;
    const k = Math.min(this.t / this.dur, 1), ease = k * k * (3 - 2 * k);
    this.pos.y = this.startY + (this.spawn.y - this.startY) * ease;
    this.pos.x = this.spawn.x + Math.sin(this.t * 0.7) * 6 * (1 - ease);   // gentle sway
    this.pos.z = this.spawn.z + Math.cos(this.t * 0.6) * 6 * (1 - ease);
    this.group.position.copy(this.pos);
    this.group.rotation.y = Math.sin(this.t * 0.4) * 0.25 + this.t * 0.05;
    if (k > 0.9) { const c = (k - 0.9) / 0.1; this.canopy.scale.set(1, 1 - c * 0.85, 1); this.canopy.position.y = 7 - c * 4; } // collapse on landing
    // orbiting follow-cam, eased from a wide establishing shot to a close landing shot
    const ang = this.t * 0.35 + 2.2, dist = 17 - 9 * ease, hgt = 7 - 2.5 * ease;
    this.camera.position.set(this.pos.x + Math.cos(ang) * dist, this.pos.y + hgt, this.pos.z + Math.sin(ang) * dist);
    this._look.set(this.pos.x, this.pos.y + 2.4, this.pos.z);
    this.camera.lookAt(this._look);
    if (k >= 1) this.done = true;
  }

  dispose() { this.scene.remove(this.group); }
}
