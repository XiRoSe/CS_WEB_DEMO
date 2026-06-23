import { RiggedAsset } from "../../engine/assets.js";

// Animated CC0 enemies (Quaternius). Dinos charge + bite; the cyberpunk robots walk/fly + shoot.
// Each is a rigged GLB with Idle/Walk/Run/Attack/Shoot/Death clips driven by an AnimationMixer.
export const CREATURES = {
  // dinosaurs (melee)
  raptor: new RiggedAsset("/models/creatures/velociraptor.glb", 2.4),
  spider: new RiggedAsset("/models/creatures/spider.glb", 1.5),
  trex:   new RiggedAsset("/models/creatures/trex.glb", 7.0),
  // robots (ranged)
  mech:   new RiggedAsset("/models/creatures/mech.glb", 7.2),
  sentry: new RiggedAsset("/models/creatures/Enemy_2Legs_Gun.glb", 2.5),  // walking gun-bot
  drone:  new RiggedAsset("/models/creatures/Enemy_Flying_Gun.glb", 1.9), // hovering gun-drone
  heavy:  new RiggedAsset("/models/creatures/Enemy_Large_Gun.glb", 3.6),  // heavy gun-bot
};

export function preloadCreatures() { return Promise.all(Object.values(CREATURES).map((a) => a.preload())); }

// Playable heroes (KayKit Adventurers) — the player picks one in the lobby; used as the parachute avatar.
export const HEROES = {
  barbarian: new RiggedAsset("/models/creatures/barbarian.glb", 2.3),
  knight: new RiggedAsset("/models/creatures/kayknight.glb", 2.3),
  rogue: new RiggedAsset("/models/creatures/rogue.glb", 2.2),
  mage: new RiggedAsset("/models/creatures/mage.glb", 2.2),
};
export const HERO_LIST = [
  { id: "barbarian", label: "Barbarian", tag: "Brute force & a two-handed axe" },
  { id: "knight", label: "Knight", tag: "Sword-and-shield bulwark" },
  { id: "rogue", label: "Rogue", tag: "Fast, silent, deadly" },
  { id: "mage", label: "Mage", tag: "Arcane firepower" },
];
export function preloadHeroes() { return Promise.all(Object.values(HEROES).map((a) => a.preload())); }
