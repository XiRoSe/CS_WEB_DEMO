import * as THREE from "three";
import { box } from "../../engine/primitives.js";

// A fast low-poly beast that charges the player and melees on contact. Drop-in compatible with
// Combat (same interface as Enemy: pos, hp, dead, counted, removable, hitbox, takeDamage, update).
export class Monster {
  constructor(scene, spawn, level) {
    this.scene = scene; this.level = level;
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.hp = spawn.hp || 70;
    this.speed = spawn.speed || 4.2;
    this.dead = false; this.counted = false; this.removable = false;
    this.yaw = 0; this._t = Math.random() * 6; this._atkCd = 0; this._deathT = 0;
    this.group = new THREE.Group(); this.group.position.copy(this.pos); this.scene.add(this.group);
    this._build();
  }

  _build() {
    const body = box(0.95, 0.8, 1.35, 0x6e2a2a, { roughness: 0.85 }); body.position.y = 1.0; body.castShadow = true; this.group.add(body);
    const head = box(0.62, 0.55, 0.6, 0x7d3232, { roughness: 0.85 }); head.position.set(0, 1.28, 0.85); this.group.add(head);
    for (const dx of [-0.16, 0.16]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffaa00, emissiveIntensity: 2.2 }));
      e.position.set(dx, 1.34, 1.12); this.group.add(e);
    }
    for (const [dx, dz] of [[-0.36, 0.42], [0.36, 0.42], [-0.36, -0.42], [0.36, -0.42]]) {
      const l = box(0.2, 0.95, 0.2, 0x4a1d1d, { roughness: 0.9 }); l.position.set(dx, 0.47, dz); this.group.add(l);
    }
    this.hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.7, 1.7), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    this.hitbox.position.y = 1.0; this.hitbox.userData.enemy = this; this.group.add(this.hitbox);
  }

  takeDamage(dmg) { if (this.dead) return; this.hp -= dmg; if (this.hp <= 0) this._die(); }
  _die() { this.dead = true; this.hitbox.userData.enemy = null; this.hitbox.visible = false; this._deathT = 1.1; }

  update(dt, playerPos, ctx) {
    this._t += dt;
    if (this.dead) { // topple + sink, then let Combat remove it
      this.group.rotation.x = Math.min(Math.PI / 2, this.group.rotation.x + dt * 3.2);
      this.group.position.y = Math.max(-0.7, this.group.position.y - dt * 0.9);
      if ((this._deathT -= dt) <= 0) this.removable = true;
      return;
    }
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    this.yaw = Math.atan2(dx, dz); this.group.rotation.y = this.yaw;
    if (d > 2.0) { // charge
      const step = this.speed * dt;
      const nx = this.pos.x + (dx / d) * step, nz = this.pos.z + (dz / d) * step;
      if (!this._blocked(nx, this.pos.z)) this.pos.x = nx;
      if (!this._blocked(this.pos.x, nz)) this.pos.z = nz;
      this.group.position.set(this.pos.x, Math.abs(Math.sin(this._t * 11)) * 0.2, this.pos.z); // gallop
    } else { // melee on a cooldown
      this.group.position.set(this.pos.x, 0, this.pos.z);
      if ((this._atkCd -= dt) <= 0) { this._atkCd = 0.85; ctx.onPlayerHit?.(8 + Math.floor(Math.random() * 6)); }
    }
  }

  _blocked(x, z) {
    for (const c of this.level.colliders) {
      if (c.top < 0.6) continue;
      if (x > c.minX - 0.5 && x < c.maxX + 0.5 && z > c.minZ - 0.5 && z < c.maxZ + 0.5) return true;
    }
    return false;
  }
}
