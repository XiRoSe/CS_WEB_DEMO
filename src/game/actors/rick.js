import * as THREE from "three";
import { RICK_MODEL, RICK_SHOOT, RM_HAND_BONE, clipsOf } from "./rickmorty-assets.js";
import { makeHeldGun, gunKindForMode } from "./heldguns.js";

// 3rd-person RICK avatar. Now SKELETALLY ANIMATED (Mesh2Motion rig): Walk_Loop plays while moving, the
// held weapon is parented to the right-hand bone so it follows the hands, and Pistol_Shoot fires on demand.
// Falls back to a procedural homage if the rigged GLB isn't present. Returns { group, update, setWeapon, fireKick }.
export function makeRick() {
  const group = new THREE.Group();
  let mixer = null, walk = null, shoot = null, hand = null, glb = false;
  let legL, legR, armL, armR; // procedural fallback handles

  if (RICK_MODEL.ready) {
    const inst = RICK_MODEL.make({ rightHand: RM_HAND_BONE });
    group.add(inst.model);
    mixer = new THREE.AnimationMixer(inst.model);
    for (const c of inst.animations) if (/walk/i.test(c.name)) walk = mixer.clipAction(c);
    const sc = clipsOf(RICK_SHOOT).find((c) => /shoot|pistol/i.test(c.name));
    if (sc) shoot = mixer.clipAction(sc);
    hand = inst.bones.rightHand;
    if (walk) { walk.play(); walk.setEffectiveWeight(0); }
    glb = true;
  } else {
    buildProcedural(group, (l, r, al, ar) => { legL = l; legR = r; armL = al; armR = ar; });
  }

  // held weapon — parented to the hand bone when rigged (moves with the animation), else to the body
  const holder = hand || group;
  const invScale = (RICK_MODEL._asset ? 1 / RICK_MODEL._asset.scale : 1);
  let gun = null, gunKind = null;
  const setWeapon = (mode) => {
    const k = gunKindForMode(mode); if (k === gunKind) return; gunKind = k;
    if (gun) holder.remove(gun);
    gun = makeHeldGun(k);
    holder.add(gun);
    if (hand) { // size the gun to the bone's real world scale so it's ~0.55m regardless of rig scale; aim it down the arm
      hand.updateWorldMatrix(true, false);
      const ws = new THREE.Vector3(); hand.getWorldScale(ws); const kk = 0.55 / (ws.x || 1);
      gun.scale.setScalar(kk); gun.position.set(0, 0, 0); gun.rotation.set(Math.PI / 2, 0, 0);
    } else { gun.scale.setScalar(1); gun.position.set(0.34, 1.16, 0.34); gun.rotation.set(0, 0, 0); }
  };
  setWeapon("sword");

  let phase = 0, walkW = 0;
  return {
    group, setWeapon,
    fireKick() { if (shoot) { shoot.reset(); shoot.setLoop(THREE.LoopOnce, 1); shoot.clampWhenFinished = true; shoot.setEffectiveWeight(0.9).play(); } },
    update(dt, moving, speed = 1) {
      if (mixer) {
        mixer.update(dt);
        walkW += ((moving ? 1 : 0) - walkW) * Math.min(1, dt * 10); // crossfade walk in/out by movement
        if (walk) { walk.setEffectiveWeight(walkW); walk.setEffectiveTimeScale(4 * speed); } // 4x → reads as a run
      } else if (legL) { // procedural fallback walk
        phase += dt * (moving ? 8.5 * speed : 2); const sw = Math.sin(phase);
        if (moving) { legL.rotation.x = sw * 0.7; legR.rotation.x = -sw * 0.7; armL.rotation.x = -sw * 0.6; armR.rotation.x = sw * 0.6; }
        else { legL.rotation.x *= 0.85; legR.rotation.x *= 0.85; }
      }
    },
  };
}

function buildProcedural(group, refs) {
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
  const COAT = 0xcfe3ea, SKIN = 0xe8c9a8, HAIR = 0x9fd6e6, PANTS = 0x8a8f98, SHOE = 0x4a3b2e, BROW = 0x7a8a90;
  const legG = new THREE.Group(); group.add(legG);
  const mkLeg = (x) => { const leg = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.95, 8), mat(PANTS)); t.position.y = -0.48; leg.add(t); const s = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mat(SHOE)); s.position.set(0, -0.98, 0.07); leg.add(s); leg.position.set(x, 0.95, 0); legG.add(leg); return leg; };
  const legL = mkLeg(-0.17), legR = mkLeg(0.17);
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.1, 10), mat(COAT)); coat.position.y = 1.55; group.add(coat);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.16), mat(0x6fae9b)); shirt.position.set(0, 1.62, 0.3); group.add(shirt);
  const mkArm = (x) => { const arm = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.92, 8), mat(COAT)); s.position.y = -0.42; arm.add(s); const h = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(SKIN)); h.position.y = -0.9; arm.add(h); arm.position.set(x, 2.0, 0); group.add(arm); return arm; };
  const armL = mkArm(-0.44), armR = mkArm(0.44);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.44), mat(SKIN)); head.position.y = 2.42; group.add(head);
  for (const sx of [-0.11, 0.11]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), mat(0xffffff, { roughness: 0.3 })); e.position.set(sx, 2.46, 0.22); group.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x101010)); p.position.set(sx, 2.46, 0.29); group.add(p); }
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), mat(BROW)); brow.position.set(0, 2.58, 0.23); group.add(brow);
  const hair = new THREE.Group(); hair.position.y = 2.7; group.add(hair);
  for (const [x, y, z, tilt] of [[0, 0, 0, 0], [-0.16, -0.02, 0.05, 0.4], [0.16, -0.02, 0.05, -0.4], [-0.1, 0, -0.16, 0.2], [0.1, 0, -0.16, -0.2], [0, 0.04, 0.16, 0]]) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 7), mat(HAIR)); s.position.set(x, y + 0.18, z); s.rotation.z = tilt; hair.add(s); }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  refs(legL, legR, armL, armR);
}
