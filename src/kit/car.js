import * as THREE from "three";
import { makeVehicle } from "./content/vehicles.js";

// A driveable arcade car: reuses a CC0 vehicle model, follows the terrain, steers like an arcade racer.
// The game enters/exits it and hands control of the camera to chaseCamera() while driving.
export class Car {
  constructor(scene, x, z, level, type = "suv") {
    this.scene = scene; this.level = level;
    this.group = makeVehicle(type);
    this.pos = new THREE.Vector3(x, 0, z);
    this.yaw = Math.random() * Math.PI * 2; this.speed = 0;
    this.r = 3.2;                 // enter/interact radius
    this.maxSpeed = 40; this.maxRev = 11;   // fast sports car
    this._tmp = new THREE.Vector3(); this._look = new THREE.Vector3();
    this.scene.add(this.group);
    this.seat();
  }

  _groundY(x, z) { return this.level.terrainHeight ? this.level.terrainHeight(x, z) : 0; }

  seat() {
    const gy = this._groundY(this.pos.x, this.pos.z);
    this.group.position.set(this.pos.x, gy, this.pos.z);
    // bank the body to the terrain slope so it hugs hills
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const ahead = this._groundY(this.pos.x + fx * 2, this.pos.z + fz * 2);
    const pitch = Math.atan2(ahead - gy, 2);
    this.group.rotation.set(-pitch, this.yaw, 0);
  }

  update(dt, input) {
    const fwd = input.isDown("w", "arrowup"), back = input.isDown("s", "arrowdown");
    const steer = (input.isDown("a", "arrowleft") ? 1 : 0) - (input.isDown("d", "arrowright") ? 1 : 0);
    // accelerate / brake / reverse
    if (fwd) this.speed += 28 * dt;
    else if (back) this.speed -= (this.speed > 0.6 ? 52 : 20) * dt;   // firm brake when rolling forward, else reverse
    else this.speed -= this.speed * Math.min(1, 1.3 * dt);            // coast drag
    this.speed = Math.max(-this.maxRev, Math.min(this.maxSpeed, this.speed));
    if (!fwd && !back && Math.abs(this.speed) < 0.2) this.speed = 0;
    // steering scales with speed (and naturally reverses when backing up)
    const grip = Math.max(-1, Math.min(1, this.speed / 10));
    this.yaw += steer * 1.7 * dt * grip;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), d = this.speed * dt;
    const nx = this.pos.x + fx * d, nz = this.pos.z + fz * d;
    if (!this._blocked(nx, this.pos.z)) this.pos.x = nx; else this.speed *= 0.25;
    if (!this._blocked(this.pos.x, nz)) this.pos.z = nz; else this.speed *= 0.25;
    const b = this.level.bounds;
    if (b) { this.pos.x = Math.max(b.minX, Math.min(b.maxX, this.pos.x)); this.pos.z = Math.max(b.minZ, Math.min(b.maxZ, this.pos.z)); }
    this.seat();
  }

  // smoothed behind-and-above chase camera (lags slightly for a nicer feel)
  chaseCamera(camera, dt = 0.016) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), gy = this.group.position.y;
    const tx = this.pos.x - fx * 9, ty = gy + 4.5, tz = this.pos.z - fz * 9;
    if (!this._cam) this._cam = new THREE.Vector3(tx, ty, tz);
    const k = 1 - Math.pow(0.0008, dt); // exponential smoothing toward the target
    this._cam.x += (tx - this._cam.x) * k; this._cam.y += (ty - this._cam.y) * k; this._cam.z += (tz - this._cam.z) * k;
    camera.position.copy(this._cam);
    this._look.set(this.pos.x + fx * 6, gy + 1.6, this.pos.z + fz * 6);
    camera.lookAt(this._look);
  }

  // a seat-exit spot beside the car (on the ground)
  exitSpot() {
    const sx = this.pos.x - Math.cos(this.yaw) * 3, sz = this.pos.z + Math.sin(this.yaw) * 3;
    return this._tmp.set(sx, this._groundY(sx, sz), sz);
  }

  _blocked(x, z) {
    for (const c of this.level.colliders) {
      if (c.top < 0.6) continue;
      if (x > c.minX - this.r && x < c.maxX + this.r && z > c.minZ - this.r && z < c.maxZ + this.r) return true;
    }
    return false;
  }
}
