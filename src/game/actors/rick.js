import * as THREE from "three";
import { RICK_MODEL } from "./rickmorty-assets.js";

// The 3rd-person player avatar (RICK). Uses the dropped-in /models/rick.glb when available, else a
// procedural homage. Adds a held gun prop in front of the right hand (the 1st-person viewmodel is hidden
// in 3rd-person). Returns { group, update(dt, moving) } so the runner can place/orient + animate it.
export function makeRick() {
  const group = new THREE.Group();
  let legL, legR, armL, armR, glb = false;

  if (RICK_MODEL.ready) {
    group.add(RICK_MODEL.make());                 // real GLB, normalized + seated on the ground
    glb = true;
  } else {
    buildProcedural(group, (l, r, al, ar) => { legL = l; legR = r; armL = al; armR = ar; });
  }

  // (no added gun prop — the Rick GLB already comes holding his portal gun; for the procedural fallback we
  // leave him empty-handed rather than attach a mismatched blaster.)
  let phase = 0;
  return {
    group,
    update(dt, moving, speed = 1) {
      phase += dt * (moving ? 9 * speed : 2.2);
      const sw = Math.sin(phase);
      if (!glb && legL) { // animate the procedural rig's walk cycle
        if (moving) { legL.rotation.x = sw * 0.7; legR.rotation.x = -sw * 0.7; armL.rotation.x = -sw * 0.6; armR.rotation.x = sw * 0.6; }
        else { legL.rotation.x *= 0.8; legR.rotation.x *= 0.8; }
      }
      if (moving) group.position.y += Math.abs(sw) * (glb ? 0.025 : 0.04); // subtle body bob either way
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
