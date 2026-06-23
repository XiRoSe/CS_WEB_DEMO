import * as THREE from "three";
import { noOutline } from "../engine/primitives.js";

// First-person parachute insertion: you drift down from the sky under a canopy onto the spawn.
// Same interface as Intro ({ start(), update(dt), done, dispose() }) so the runner treats them alike.
export class ParachuteIntro {
  constructor(scene, camera, spawn) {
    this.scene = scene; this.camera = camera;
    this.spawn = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.t = 0; this.dur = 6.5; this.done = false;
    this.startY = 130;

    this.group = new THREE.Group(); this.scene.add(this.group);
    // canopy dome above the player
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2),
      noOutline(new THREE.MeshStandardMaterial({ color: 0xdb4f33, roughness: 0.85, side: THREE.DoubleSide })),
    );
    canopy.position.y = 6; this.group.add(canopy);
    // alternating gore panels for a bit of detail
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const panel = new THREE.Mesh(new THREE.SphereGeometry(3.42, 4, 6, a, Math.PI / 4, 0, Math.PI / 2),
        noOutline(new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf0e6da : 0xdb4f33, roughness: 0.85, side: THREE.DoubleSide })));
      panel.position.y = 6; this.group.add(panel);
    }
    // risers from the harness up to the canopy rim
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 5.4, 4), noOutline(new THREE.MeshBasicMaterial({ color: 0x20242a })));
      r.position.set(Math.cos(a) * 1.7, 3.2, Math.sin(a) * 1.7);
      r.rotation.z = -Math.cos(a) * 0.3; r.rotation.x = Math.sin(a) * 0.3;
      this.group.add(r);
    }
    this._look = new THREE.Vector3();
  }

  start() {}

  update(dt) {
    this.t += dt;
    const k = Math.min(this.t / this.dur, 1);
    const ease = k * k * (3 - 2 * k);                  // smoothstep descent
    const y = this.startY + (1.6 - this.startY) * ease;
    const swayX = Math.sin(this.t * 0.8) * 2.6 * (1 - ease);
    const swayZ = Math.cos(this.t * 0.7) * 2.6 * (1 - ease);
    this.camera.position.set(this.spawn.x + swayX, y, this.spawn.z + swayZ);
    // gaze drifts toward the island below/ahead as you come down
    this._look.set(this.spawn.x + swayX * 3, y - 14, this.spawn.z - 16);
    this.camera.lookAt(this._look);
    this.group.position.copy(this.camera.position); // canopy rides overhead
    this.group.rotation.y = Math.sin(this.t * 0.5) * 0.12;
    if (k >= 1) this.done = true;
  }

  dispose() { this.scene.remove(this.group); }
}
