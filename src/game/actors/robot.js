import * as THREE from "three";
import { box, cyl, COLORS } from "../../engine/primitives.js";

// A giant slow mech: tanky, walks toward the player and fires its arm-cannon (LOS-checked). Goes up
// in a big explosion on death. Drop-in compatible with Combat (same interface as Enemy).
export class Robot {
  constructor(scene, spawn, level) {
    this.scene = scene; this.level = level;
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.hp = spawn.hp || 600;
    this.speed = spawn.speed || 1.4;
    this.dead = false; this.counted = false; this.removable = false;
    this.yaw = 0; this._t = Math.random() * 6; this._fireCd = 2.5; this._deathT = 0; this._needBoom = false;
    this._muzzle = new THREE.Vector3(); this._tmp = new THREE.Vector3();
    this.group = new THREE.Group(); this.group.position.copy(this.pos); this.scene.add(this.group);
    this._build();
  }

  _build() {
    const dark = COLORS.metalDark, metal = COLORS.metal;
    const torso = box(2.2, 2.4, 1.6, metal, { metalness: 0.6, roughness: 0.4 }); torso.position.y = 4.6; torso.castShadow = true; this.group.add(torso);
    const head = box(1.0, 0.9, 1.0, dark, { metalness: 0.6 }); head.position.y = 6.1; this.group.add(head);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3a2a, emissive: 0xff2a18, emissiveIntensity: 2.6 }));
    eye.position.set(0, 6.12, 0.52); this.group.add(eye);
    const arm = cyl(0.32, 0.32, 2.1, dark, 10, { metalness: 0.6 }); arm.rotation.x = Math.PI / 2; arm.position.set(1.45, 4.8, 0.7); this.group.add(arm);
    for (const dx of [-0.72, 0.72]) { const leg = box(0.72, 3.4, 0.85, dark, { metalness: 0.5 }); leg.position.set(dx, 1.7, 0); leg.castShadow = true; this.group.add(leg); }
    this._gunTip = new THREE.Object3D(); this._gunTip.position.set(1.45, 4.8, 1.8); this.group.add(this._gunTip);
    this.hitbox = new THREE.Mesh(new THREE.BoxGeometry(2.8, 6.6, 2.1), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    this.hitbox.position.y = 3.4; this.hitbox.userData.enemy = this; this.group.add(this.hitbox);
  }

  takeDamage(dmg) { if (this.dead) return; this.hp -= dmg; if (this.hp <= 0) this._die(); }
  _die() { this.dead = true; this.hitbox.userData.enemy = null; this.hitbox.visible = false; this._deathT = 1.6; this._needBoom = true; }

  update(dt, playerPos, ctx) {
    this._t += dt;
    if (this.dead) { // big boom, then topple + sink
      if (this._needBoom) { this._needBoom = false; ctx.vfx?.explosion?.(this._tmp.copy(this.group.position).setY(4), 1.9); ctx.audio?.explosion?.(); }
      this.group.rotation.z += dt * 1.1; this.group.position.y -= dt * 2.4;
      if ((this._deathT -= dt) <= 0) this.removable = true;
      return;
    }
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    this.yaw = Math.atan2(dx, dz); this.group.rotation.y = this.yaw;
    if (d > 14) { // lumber toward the player
      const step = this.speed * dt;
      const nx = this.pos.x + (dx / d) * step, nz = this.pos.z + (dz / d) * step;
      if (!this._blocked(nx, this.pos.z)) this.pos.x = nx;
      if (!this._blocked(this.pos.x, nz)) this.pos.z = nz;
      this.group.position.set(this.pos.x, Math.abs(Math.sin(this._t * 3)) * 0.12, this.pos.z);
    }
    if ((this._fireCd -= dt) <= 0 && !this.level.segmentBlocked(this.pos.x, this.pos.z, playerPos.x, playerPos.z, 2.8)) {
      this._fireCd = 1.6 + Math.random() * 1.2;
      this._gunTip.getWorldPosition(this._muzzle);
      ctx.vfx?.muzzle?.(this._muzzle);
      ctx.vfx?.tracer?.(this._muzzle, this._tmp.set(playerPos.x, playerPos.y - 0.1, playerPos.z));
      ctx.audio?.heliShot?.();
      if (Math.random() < 0.4) ctx.onPlayerHit?.(10 + Math.floor(Math.random() * 8));
    }
  }

  _blocked(x, z) {
    for (const c of this.level.colliders) {
      if (c.top < 0.6) continue;
      if (x > c.minX - 1 && x < c.maxX + 1 && z > c.minZ - 1 && z < c.maxZ + 1) return true;
    }
    return false;
  }
}
