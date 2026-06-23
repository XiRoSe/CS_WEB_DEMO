import * as THREE from "three";
import { CREATURES } from "./creature-assets.js";

// A giant animated mech (Quaternius): lumbers toward the player and fires (LOS-checked), big boom on
// death. Drop-in compatible with Combat (pos, hp, dead, counted, removable, hitbox, takeDamage, update).
export class Robot {
  constructor(scene, spawn, level) {
    this.scene = scene; this.level = level;
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.hp = spawn.hp || 600;
    this.speed = spawn.speed || 1.6;
    this.dead = false; this.counted = false; this.removable = false;
    this.yaw = 0; this._fireCd = 2.5; this._deathT = 0; this._needBoom = false; this._cur = null; this._curAction = null;
    this._muzzle = new THREE.Vector3(); this._tmp = new THREE.Vector3();

    this.group = new THREE.Group(); this.group.position.copy(this.pos); this.scene.add(this.group);
    const inst = CREATURES.mech.make();
    if (inst) {
      this.model = inst.model;
      this.model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      this.group.add(this.model);
      this.mixer = new THREE.AnimationMixer(this.model);
      this._actions = {}; for (const c of inst.animations) this._actions[c.name] = this.mixer.clipAction(c);
      this._play("idle");
    }
    this._gunTip = new THREE.Object3D(); this._gunTip.position.set(0, 5.2, 2.4); this.group.add(this._gunTip);
    const hbMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    hbMat.userData.outlineParameters = { visible: false }; // no ink outline on the invisible hitbox
    this.hitbox = new THREE.Mesh(new THREE.BoxGeometry(3.2, 7.2, 3.0), hbMat);
    this.hitbox.position.y = 3.6; this.hitbox.userData.enemy = this; this.group.add(this.hitbox);
  }

  _play(key, fade = 0.25, once = false) {
    if (!this._actions) return;
    const name = Object.keys(this._actions).find((n) => n.toLowerCase() === key) || Object.keys(this._actions).find((n) => n.toLowerCase().includes(key));
    if (!name || name === this._cur) return;
    const next = this._actions[name];
    if (once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; } else next.setLoop(THREE.LoopRepeat, Infinity);
    if (this._curAction) this._curAction.fadeOut(fade);
    next.reset().fadeIn(fade).play();
    this._cur = name; this._curAction = next;
  }

  takeDamage(dmg) { if (this.dead) return; this.hp -= dmg; if (this.hp <= 0) this._die(); }
  _die() { this.dead = true; this.hitbox.userData.enemy = null; this.hitbox.visible = false; this._deathT = 2.0; this._needBoom = true; this._play("death", 0.12, true); }

  update(dt, playerPos, ctx) {
    this.mixer?.update(dt);
    const groundY = this.level.terrainHeight ? this.level.terrainHeight(this.pos.x, this.pos.z) : 0;
    if (this.dead) {
      if (this._needBoom) { this._needBoom = false; ctx.vfx?.explosion?.(this._tmp.copy(this.group.position).setY(groundY + 4), 1.9); ctx.audio?.explosion?.(); }
      this.group.position.y = groundY;
      if ((this._deathT -= dt) <= 0) this.removable = true;
      return;
    }
    const dx = playerPos.x - this.pos.x, dz = playerPos.z - this.pos.z, d = Math.hypot(dx, dz) || 1;
    this.yaw = Math.atan2(dx, dz); this.group.rotation.y = this.yaw;
    if (d > 16) { // lumber toward the player
      const step = this.speed * dt;
      const nx = this.pos.x + (dx / d) * step, nz = this.pos.z + (dz / d) * step;
      if (!this._blocked(nx, this.pos.z)) this.pos.x = nx;
      if (!this._blocked(this.pos.x, nz)) this.pos.z = nz;
      this._play("walk");
    } else {
      this._play("idle");
    }
    this.group.position.set(this.pos.x, groundY, this.pos.z);
    if ((this._fireCd -= dt) <= 0 && !this.level.segmentBlocked(this.pos.x, this.pos.z, playerPos.x, playerPos.z, 2.8)) {
      this._fireCd = 1.7 + Math.random() * 1.1;
      this._play("shoot", 0.1, true);
      this._gunTip.getWorldPosition(this._muzzle);
      ctx.vfx?.muzzle?.(this._muzzle);
      ctx.vfx?.tracer?.(this._muzzle, this._tmp.set(playerPos.x, playerPos.y - 0.1, playerPos.z));
      ctx.audio?.heliShot?.();
      if (Math.random() < 0.45) ctx.onPlayerHit?.(10 + Math.floor(Math.random() * 9));
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
