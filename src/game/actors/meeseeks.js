import * as THREE from "three";

// MR. MEESEEKS — a procedural low-poly enemy that swarms the player and swats on contact, then POOFS
// into a blue cloud on death ("existence is pain!"). Drop-in compatible with Combat
// (pos, hp, dead, counted, removable, hitbox, takeDamage, update(dt, playerPos, ctx)).
export class Meeseeks {
  constructor(scene, spawn, level) {
    this.scene = scene; this.level = level; this.kind = "meeseeks";
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.hp = spawn.hp || 45;
    this.speed = spawn.speed || (6.5 + Math.random() * 1.5);
    this.melee = 8; this.reach = 2.2;
    this.dead = false; this.counted = false; this.removable = false;
    this.aggro = false; this.aggroRange = spawn.aggro || 30;
    this.yaw = 0; this._atkCd = 0; this._t = Math.random() * 6;

    const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, flatShading: true, ...o });
    const BLUE = 0x49a9d6;
    this.group = new THREE.Group(); this.group.position.copy(this.pos); scene.add(this.group);

    // tall smooth blue body (Meeseeks are basically a blue capsule with a face)
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.0, 6, 12), mat(BLUE)); body.position.y = 1.15; this.group.add(body);
    // big white eyes + black pupils + a worried frown
    for (const sx of [-0.17, 0.17]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat(0xffffff, { roughness: 0.3 })); eye.position.set(sx, 1.62, 0.34); this.group.add(eye);
      const pup = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0x0a0a0a)); pup.position.set(sx, 1.62, 0.47); this.group.add(pup);
    }
    const frown = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 10, Math.PI), mat(0x0a0a0a)); frown.position.set(0, 1.34, 0.42); frown.rotation.z = Math.PI; this.group.add(frown);
    // stubby flailing arms (refs to wave them)
    const mkArm = (x) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), mat(BLUE)); a.position.set(x, 1.2, 0); this.group.add(a); return a; };
    this.armL = mkArm(-0.5); this.armR = mkArm(0.5);
    this.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    const hbMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); hbMat.userData.outlineParameters = { visible: false };
    this.hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 1.1), hbMat); this.hitbox.position.y = 1.0;
    this.hitbox.userData.enemy = this; this.group.add(this.hitbox);
  }

  takeDamage(dmg) { if (this.dead) return; this.aggro = true; this.hp -= dmg; if (this.hp <= 0) this._die(); }

  _die() {
    this.dead = true; this.hitbox.userData.enemy = null; this.hitbox.visible = false; this._deathT = 0.6;
    if (this._ctx) { // POOF — a blue cloud + the catchphrase, no corpse
      const p = this.group.position;
      for (let i = 0; i < 10; i++) this._ctx.vfx?.dustBurst?.(new THREE.Vector3(p.x + (Math.random() - 0.5) * 1.4, p.y + 0.6 + Math.random() * 1.4, p.z + (Math.random() - 0.5) * 1.4));
      this._ctx.vfx?._flash?.(new THREE.Vector3(p.x, p.y + 1, p.z), 1.6, 0x6fd0ff);
      this._ctx.audio?.creature?.();
    }
    this.group.visible = false; // poof = gone instantly
  }

  update(dt, playerPos, ctx) {
    this._ctx = ctx; this._t += dt;
    const gy = this.level.terrainHeight ? this.level.terrainHeight(this.pos.x, this.pos.z) : 0;
    if (this.dead) { if ((this._deathT -= dt) <= 0) this.removable = true; return; }
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    if (!this.aggro) { if (d <= this.aggroRange) this.aggro = true; else { this._idle(dt, gy); return; } }
    this.yaw = Math.atan2(dx, dz); this.group.rotation.y = this.yaw;
    const hop = Math.abs(Math.sin(this._t * 11)) * 0.22; // bouncy gait
    if (d > this.reach) {
      const step = this.speed * dt;
      const nx = this.pos.x + (dx / d) * step, nz = this.pos.z + (dz / d) * step;
      if (!this._blocked(nx, this.pos.z)) this.pos.x = nx;
      if (!this._blocked(this.pos.x, nz)) this.pos.z = nz;
      this.armL.rotation.x = Math.sin(this._t * 14) * 1.1; this.armR.rotation.x = -Math.sin(this._t * 14) * 1.1; // flailing
    } else if ((this._atkCd -= dt) <= 0) { this._atkCd = 0.9; ctx.onPlayerHit?.(this.melee + Math.floor(Math.random() * 4)); ctx.audio?.creature?.(); }
    this.group.position.set(this.pos.x, gy + hop, this.pos.z);
  }

  _idle(dt, gy) {
    this.group.position.y = gy + Math.abs(Math.sin(this._t * 3)) * 0.08; // gentle idle bob
    this.armL.rotation.x = Math.sin(this._t * 2) * 0.2; this.armR.rotation.x = -Math.sin(this._t * 2) * 0.2;
  }

  _blocked(x, z) {
    for (const c of this.level.colliders) {
      if (c.top < 0.6) continue;
      if (x > c.minX - 0.5 && x < c.maxX + 0.5 && z > c.minZ - 0.5 && z < c.maxZ + 0.5) return true;
    }
    return false;
  }
}
