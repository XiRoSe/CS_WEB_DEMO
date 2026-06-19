import * as THREE from "three";
import { COLORS, box, cyl } from "../util/builders.js";

// Attack helicopter boss: descends from the sky, hovers and strafes while firing,
// can be shot down, then explodes and crashes.
export class Helicopter {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.hp = 260;
    this.dead = false;
    this.removable = false;
    this.state = "descend";
    this.fireCd = 1.0;
    this.deathT = 0;
    this._needExplode = false;
    this._smokeT = 0;

    this.hoverY = 15;
    this.pos = new THREE.Vector3((Math.random() - 0.5) * 8, 46, -2);

    this.group = new THREE.Group();
    this._build();
    this.group.position.copy(this.pos);
    this.scene.add(this.group);

    this._muzzle = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
  }

  _build() {
    const dark = COLORS.metalDark, olive = COLORS.oliveDark, metal = COLORS.metal;
    // fuselage
    const body = box(1.7, 1.5, 3.6, olive, { metalness: 0.4, roughness: 0.6 });
    body.position.y = 0; this.group.add(body);
    // nose / cockpit glass
    const nose = box(1.5, 1.2, 1.2, 0x2a3a44, { metalness: 0.6, roughness: 0.3 });
    nose.position.set(0, 0.05, 2.1); this.group.add(nose);
    // tail boom
    const boom = box(0.5, 0.5, 3.4, olive, { metalness: 0.4, roughness: 0.6 });
    boom.position.set(0, 0.25, -3.2); this.group.add(boom);
    const fin = box(0.18, 1.1, 0.7, olive, { metalness: 0.4, roughness: 0.6 });
    fin.position.set(0, 0.7, -4.7); this.group.add(fin);
    // skids
    for (const sx of [-0.8, 0.8]) {
      const skid = cyl(0.08, 0.08, 3, metal, 6, { metalness: 0.6 });
      skid.rotation.x = Math.PI / 2; skid.position.set(sx, -1.0, 0.2); this.group.add(skid);
      const strut = box(0.1, 0.5, 0.1, metal); strut.position.set(sx, -0.7, 0.6); this.group.add(strut);
    }
    // main rotor (hub + long blades), spins around Y
    this.mainRotor = new THREE.Group();
    const hub = cyl(0.18, 0.18, 0.3, metal, 8, { metalness: 0.7 }); this.mainRotor.add(hub);
    for (let i = 0; i < 2; i++) {
      const blade = box(0.18, 0.05, 7.0, 0x202225, { roughness: 0.7 });
      blade.rotation.y = i * Math.PI / 2;
      this.mainRotor.add(blade);
    }
    this.mainRotor.position.set(0, 1.0, 0.2); this.group.add(this.mainRotor);
    // tail rotor, spins around X
    this.tailRotor = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const tb = box(0.06, 1.2, 0.12, 0x202225, { roughness: 0.7 });
      tb.rotation.z = i * Math.PI / 2; this.tailRotor.add(tb);
    }
    this.tailRotor.position.set(0.32, 0.6, -4.7); this.group.add(this.tailRotor);
    // gun mount under nose
    this._gunTip = new THREE.Object3D(); this._gunTip.position.set(0, -0.7, 2.4); this.group.add(this._gunTip);

    // big invisible hitbox (raycastable, tagged)
    this.hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.6, 8),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    );
    this.hitbox.userData.heli = this;
    this.group.add(this.hitbox);
  }

  takeDamage(dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.dead = true;
      this.deathT = 0;
      this._needExplode = true;
      this.hitbox.userData.heli = null;
      this.hitbox.visible = false;
    }
  }

  update(dt, t, playerPos, ctx) {
    // rotor spin (slows after death)
    const spin = this.dead ? 4 : 26;
    this.mainRotor.rotation.y += spin * dt;
    this.tailRotor.rotation.x += spin * 1.6 * dt;

    if (this.dead) {
      if (this._needExplode) {
        this._needExplode = false;
        this.group.getWorldPosition(this._tmp);
        ctx.vfx.explosion(this._tmp);
        ctx.audio?.explosion?.();
        ctx.audio?.stopRotor?.();
      }
      this.deathT += dt;
      // spin out and crash down
      this.group.rotation.y += dt * 2.5;
      this.group.rotation.z += dt * 0.8;
      this.pos.y = Math.max(1.5, this.pos.y - dt * (4 + this.deathT * 3));
      this.pos.x += dt * 1.5;
      this.group.position.copy(this.pos);
      // trailing smoke + a secondary blast on impact
      this._smokeT -= dt;
      if (this._smokeT <= 0) { this._smokeT = 0.08; this.group.getWorldPosition(this._tmp); ctx.vfx.impact(this._tmp); }
      if (this.pos.y <= 1.6 && !this._impacted) {
        this._impacted = true;
        this.group.getWorldPosition(this._tmp);
        ctx.vfx.explosion(this._tmp);
        ctx.audio?.explosion?.();
      }
      if (this.deathT > 4) this.removable = true;
      return;
    }

    // face the player (yaw)
    const yaw = Math.atan2(playerPos.x - this.pos.x, playerPos.z - this.pos.z);
    this.group.rotation.y = yaw;

    if (this.state === "descend") {
      this.pos.y += (this.hoverY - this.pos.y) * Math.min(1, dt * 0.9);
      if (this.pos.y < this.hoverY + 0.6) this.state = "attack";
    } else {
      // hover bob + slow strafe around the yard
      this.pos.x += Math.cos(t * 0.4) * dt * 2.2;
      this.pos.z = -2 + Math.sin(t * 0.3) * 6;
      this.pos.y = this.hoverY + Math.sin(t * 1.5) * 0.4;
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        this.fireCd = 0.55 + Math.random() * 0.4;
        this._fire(playerPos, ctx);
      }
    }
    this.group.position.copy(this.pos);
  }

  _fire(playerPos, ctx) {
    this._gunTip.getWorldPosition(this._muzzle);
    ctx.vfx.muzzle(this._muzzle);
    ctx.audio?.heliShot?.();
    this._tmp.set(playerPos.x, playerPos.y - 0.1, playerPos.z);
    ctx.vfx.tracer(this._muzzle, this._tmp);
    // a short burst with modest accuracy
    if (Math.random() < 0.3) ctx.onPlayerHit(5 + Math.floor(Math.random() * 6));
  }
}
