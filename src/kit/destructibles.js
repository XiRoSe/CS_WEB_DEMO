import * as THREE from "three";
import { applyBlast } from "../engine/projectiles.js";

// Shootable destructibles (fuel barrels, fuel tanks, vehicles). They use the "unit" damage scale
// (rifle 1 / grenade 5 / rocket 15); HP lives on each record (set by the LevelBuilder from config).
// Decoupled from the runner via a small ctx of live refs/callbacks:
//   { scene, level, vfx, audio, hud, camera, balance, enemies(), hurtPlayer(dmg) }
export class Destructibles {
  constructor(ctx) { this.ctx = ctx; }

  /** rifle/blast unit damage to a barrel/tank record; cooks off at 0 HP. */
  damageExplosive(rec, units) { if (rec && !rec.exploded) { rec.hp -= units; if (rec.hp <= 0) this.explodeBarrel(rec); } }
  /** rifle/blast unit damage to a vehicle record; blows up at 0 HP. */
  damageVehicle(rec, units) { if (rec && !rec.exploded) { rec.hp -= units; if (rec.hp <= 0) this.explodeVehicle(rec); } }

  /** apply a projectile blast's unit damage to every destructible within radius. */
  blastUnits(center, units, radius) {
    const lvl = this.ctx.level;
    if (lvl.explosives) for (const ex of lvl.explosives) {
      if (!ex.exploded && Math.hypot(ex.x - center.x, ex.z - center.z) < radius) {
        ex.hp -= units;
        if (ex.hp <= 0) setTimeout(() => this.explodeBarrel(ex), 50 + Math.random() * 120); // staggered cook-off
      }
    }
    if (lvl.vehicles) for (const v of lvl.vehicles) {
      if (!v.exploded && Math.hypot(v.x - center.x, v.z - center.z) < radius + 1.5) this.damageVehicle(v, units);
    }
  }

  _drop(arr, item) { if (arr) { const i = arr.indexOf(item); if (i >= 0) arr.splice(i, 1); } }
  _hurtPlayerIfClose(x, z, opts, factor) {
    const cam = this.ctx.camera.position;
    const pd = Math.hypot(cam.x - x, cam.z - z);
    if (pd < opts.radius) this.ctx.hurtPlayer(Math.round(opts.damage * factor * (1 - pd / opts.radius)));
  }

  // a shot fuel barrel/tank cooks off: boom, blast vs nearby enemies, hurts a too-close player,
  // and chain-detonates barrels packed right next to it.
  explodeBarrel(rec, depth = 0) {
    if (rec.exploded) return;
    rec.exploded = true;
    const { scene, level: lvl, vfx, audio, hud } = this.ctx;
    const c = new THREE.Vector3(rec.x, rec.cy || 0.75, rec.z);
    scene.remove(rec.mesh);
    this._drop(lvl.colliders, rec.collider); this._drop(lvl.dynamics, rec.dyn); this._drop(lvl.solidMeshes, rec.mesh);
    vfx.explosion(c, rec.scale || 0.9);
    audio.explosion?.();
    if (rec.scale > 1.2) hud._shake = Math.max(hud._shake || 0, 12);
    const opts = { radius: rec.radius || 7, damage: rec.damage || 240, power: 13 };
    applyBlast(c, opts, this.ctx.enemies(), null, lvl.dynamics); // heli takes only unit damage, handled by the runner
    this._hurtPlayerIfClose(rec.x, rec.z, opts, 0.22);
    if (depth < 5 && lvl.explosives) {
      for (const other of lvl.explosives) {
        if (other.exploded) continue;
        if (Math.hypot(other.x - rec.x, other.z - rec.z) < Math.max(3.0, opts.radius * 0.4)) {
          setTimeout(() => this.explodeBarrel(other, depth + 1), 110 + Math.random() * 160);
        }
      }
    }
  }

  // a vehicle cooks off: BIG explosion, the wreck is hurled into the air, tumbles, vanishes ~2s after landing.
  explodeVehicle(rec) {
    if (rec.exploded) return;
    rec.exploded = true;
    const { scene, level: lvl, vfx, audio, hud, balance } = this.ctx;
    const c = new THREE.Vector3(rec.x, 1.1, rec.z);
    this._drop(lvl.colliders, rec.collider); this._drop(lvl.solidMeshes, rec.mesh);
    vfx.explosion(c, 1.7);
    audio.explosion?.();
    hud._shake = Math.max(hud._shake || 0, 14);
    const vb = balance.vehicle;
    const opts = { radius: vb.blastRadius, damage: vb.blastDamage, power: vb.blastPower };
    applyBlast(c, opts, this.ctx.enemies(), null, lvl.dynamics);
    if (rec.dyn) { // launch the wreck (override its heavy mass — this is its own blast)
      const d = rec.dyn;
      d.rest = false; d.vanish = true; d.vanishDelay = 2;
      d.vel.set((Math.random() - 0.5) * 7, 13 + Math.random() * 5, (Math.random() - 0.5) * 7);
      d.spin.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
    }
    this._hurtPlayerIfClose(rec.x, rec.z, opts, 0.25);
    if (lvl.explosives) for (const ex of lvl.explosives) { // cook off nearby barrels too
      if (!ex.exploded && Math.hypot(ex.x - rec.x, ex.z - rec.z) < opts.radius) setTimeout(() => this.explodeBarrel(ex), 80 + Math.random() * 160);
    }
  }
}
