import * as THREE from "three";

// Low-poly HELD weapon props for 3rd-person characters (Rick + Meeseeks). Each returns a group whose
// barrel points +Z (forward), origin at the grip, so it can be parented at a hand and aim with the body.
// kind: "rifle" | "rocket" | "blaster" | "sword" (game weapon modes map onto these).
export function makeHeldGun(kind = "rifle") {
  const g = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.55, roughness: 0.45, flatShading: true, ...o });
  const metal = M(0x2b2f36), dark = M(0x16181c), wood = M(0x6b4a2e);

  if (kind === "rocket") {                                   // chunky rocket launcher: fat tube + a rocket nose + grip
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.95, 10), M(0x4b5a3a)); tube.rotation.x = Math.PI / 2; tube.position.z = 0.28; g.add(tube);
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.16, 10), dark); mouth.rotation.x = Math.PI / 2; mouth.position.z = -0.12; g.add(mouth);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 8), M(0xc23a2a, { emissive: 0x551006, emissiveIntensity: 0.5 })); nose.rotation.x = Math.PI / 2; nose.position.z = 0.78; g.add(nose);
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.18), metal); sight.position.set(0, 0.16, 0.2); g.add(sight);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.12), dark); grip.position.set(0, -0.2, 0.18); g.add(grip);
  } else if (kind === "blaster") {                           // energy gun: sleek body + glowing green core (portal-y)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.46), metal); body.position.z = 0.18; g.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 8), dark); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.5; g.add(barrel);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), M(0x7CFC00, { emissive: 0x66dd33, emissiveIntensity: 1.8 })); core.rotation.x = Math.PI / 2; core.position.z = 0.16; g.add(core);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M(0xaaff66, { emissive: 0x88ff44, emissiveIntensity: 2 })); tip.position.z = 0.7; g.add(tip);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), dark); grip.position.set(0, -0.16, 0.02); g.add(grip);
  } else if (kind === "sword") {                             // the Arc Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.0), M(0xcfd6e6, { metalness: 0.8, roughness: 0.25, emissive: 0x223344, emissiveIntensity: 0.4 })); blade.position.z = 0.5; g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), metal); g.add(guard);
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), wood); hilt.rotation.x = Math.PI / 2; hilt.position.z = -0.13; g.add(hilt);
  } else {                                                   // default RIFLE: receiver + barrel + stock + mag
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.62), metal); body.position.z = 0.16; g.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), dark); barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.6; g.add(barrel);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.24), dark); stock.position.z = -0.22; g.add(stock);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.1), dark); mag.position.set(0, -0.17, 0.16); g.add(mag);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.1), dark); grip.position.set(0, -0.14, -0.02); g.add(grip);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// map a game weapon mode → a held-gun kind
export function gunKindForMode(mode) {
  if (mode === "launcher") return "rocket";
  if (mode === "laser" || mode === "plasma") return "blaster";
  if (mode === "sword") return "sword";
  return "rifle"; // rifle/smg/minigun/burst/flak/railgun/shotgun
}

// long guns are carried two-handed (centered, across the body); pistols/blades one-handed (at the side).
// Returns the hand-socket offset {x,y,z} that makes the prop read as held that way (static meshes can't
// truly grip, so this is positional).
export function gripOffset(kind, sc = 1) {
  const two = kind === "rifle" || kind === "rocket";
  return two ? { x: 0.16 * sc, y: 1.12 * sc, z: 0.46 * sc, two: true }
             : { x: 0.34 * sc, y: 1.16 * sc, z: 0.34 * sc, two: false };
}
