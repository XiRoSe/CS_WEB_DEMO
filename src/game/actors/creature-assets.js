import { RiggedAsset } from "../../engine/assets.js";

// Animated CC0 creatures + mech (Quaternius). Each is a rigged GLB with Idle/Walk/Run/Attack/Death
// clips; the Monster/Robot actors drive them with an AnimationMixer.
export const CREATURES = {
  raptor: new RiggedAsset("/models/creatures/velociraptor.glb", 2.4),
  spider: new RiggedAsset("/models/creatures/spider.glb", 1.5),
  trex:   new RiggedAsset("/models/creatures/trex.glb", 7.0),
  mech:   new RiggedAsset("/models/creatures/mech.glb", 7.2),
};

export function preloadCreatures() { return Promise.all(Object.values(CREATURES).map((a) => a.preload())); }
