import * as THREE from "three";

// Procedural low-poly RICK — the 3rd-person player avatar. A homage build (no copyrighted model):
// lab coat, light-blue spiky hair, unibrow. Returns { group, update(t, moving) } so the runner can
// position/orient it and animate a walk cycle. Flat-shaded to match the cel-shaded kit look.
export function makeRick() {
  const group = new THREE.Group();
  const mat = (c, opts = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...opts });
  const COAT = 0xcfe3ea, SKIN = 0xe8c9a8, HAIR = 0x9fd6e6, PANTS = 0x8a8f98, SHOE = 0x4a3b2e, BROW = 0x7a8a90;

  // legs (kept as refs so we can swing them when walking)
  const legG = new THREE.Group(); group.add(legG);
  const mkLeg = (x) => {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.95, 8), mat(PANTS)); thigh.position.y = -0.48; leg.add(thigh);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.42), mat(SHOE)); shoe.position.set(0, -0.98, 0.07); leg.add(shoe);
    leg.position.set(x, 0.95, 0); legG.add(leg); return leg;
  };
  const legL = mkLeg(-0.17), legR = mkLeg(0.17);

  // torso — lab coat (slightly tapered), with a hint of collar + shirt
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 1.1, 10), mat(COAT)); coat.position.y = 1.55; group.add(coat);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.16), mat(0x6fae9b)); shirt.position.set(0, 1.62, 0.3); group.add(shirt);

  // arms (coat sleeves) — refs for the walk swing
  const mkArm = (x) => {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.92, 8), mat(COAT)); sleeve.position.y = -0.42; arm.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(SKIN)); hand.position.y = -0.9; arm.add(hand);
    arm.position.set(x, 2.0, 0); group.add(arm); return arm;
  };
  const armL = mkArm(-0.44), armR = mkArm(0.44);

  // head + face
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.44), mat(SKIN)); head.position.y = 2.42; group.add(head);
  const eyeMat = mat(0xffffff, { roughness: 0.3 }), pupMat = mat(0x101010);
  for (const sx of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), eyeMat); eye.position.set(sx, 2.46, 0.22); group.add(eye);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), pupMat); pup.position.set(sx, 2.46, 0.29); group.add(pup);
  }
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), mat(BROW)); brow.position.set(0, 2.58, 0.23); group.add(brow); // unibrow
  // light-blue spiky hair — a fan of cones around the crown
  const hair = new THREE.Group(); hair.position.y = 2.7; group.add(hair);
  const spikes = [[0, 0, 0, 0], [-0.16, -0.02, 0.05, 0.4], [0.16, -0.02, 0.05, -0.4], [-0.1, 0, -0.16, 0.2], [0.1, 0, -0.16, -0.2], [0, 0.04, 0.16, 0]];
  for (const [x, y, z, tilt] of spikes) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 7), mat(HAIR)); s.position.set(x, y + 0.18, z); s.rotation.z = tilt; hair.add(s);
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  let phase = 0;
  return {
    group,
    update(dt, moving, speed = 1) {
      phase += dt * (moving ? 9 * speed : 2.2);
      const sw = Math.sin(phase);
      if (moving) { // walk cycle: legs + arms counter-swing, slight body bob
        legL.rotation.x = sw * 0.7; legR.rotation.x = -sw * 0.7;
        armL.rotation.x = -sw * 0.6; armR.rotation.x = sw * 0.6;
        group.position.y += Math.abs(Math.sin(phase)) * 0.04;
      } else { // idle sway
        legL.rotation.x *= 0.8; legR.rotation.x *= 0.8;
        armL.rotation.x = Math.sin(phase) * 0.05 - 0.05; armR.rotation.x = -Math.sin(phase) * 0.05 - 0.05;
      }
    },
  };
}
