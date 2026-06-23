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
    this.maxSpeed = 30; this.maxRev = 9;
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
    const accel = input.isDown("w", "arrowup") ? 1 : input.isDown("s", "arrowdown") ? -1 : 0;
    const steer = (input.isDown("a", "arrowleft") ? 1 : 0) - (input.isDown("d", "arrowright") ? 1 : 0);
    this.speed += accel * 22 * dt;
    this.speed *= accel ? 1 : 0.95;                          // coast/brake drag
    this.speed = Math.max(-this.maxRev, Math.min(this.maxSpeed, this.speed));
    if (Math.abs(this.speed) < 0.05) this.speed = 0;
    this.yaw += steer * 1.7 * dt * Math.max(-1, Math.min(1, this.speed / 8)); // steering scales with speed (and reverses in reverse)
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), d = this.speed * dt;
    const nx = this.pos.x + fx * d, nz = this.pos.z + fz * d;
    if (!this._blocked(nx, this.pos.z)) this.pos.x = nx; else this.speed *= 0.3;
    if (!this._blocked(this.pos.x, nz)) this.pos.z = nz; else this.speed *= 0.3;
    const b = this.level.bounds;
    if (b) { this.pos.x = Math.max(b.minX, Math.min(b.maxX, this.pos.x)); this.pos.z = Math.max(b.minZ, Math.min(b.maxZ, this.pos.z)); }
    this.seat();
  }

  // behind-and-above chase camera
  chaseCamera(camera) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), gy = this.group.position.y;
    camera.position.set(this.pos.x - fx * 9, gy + 4.5, this.pos.z - fz * 9);
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
