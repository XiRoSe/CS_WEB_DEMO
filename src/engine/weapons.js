import { PropAsset } from "./actor.js";

// Player weapon models for this game. Low-poly CC0 rocket launcher (first-person viewmodel).
const LAUNCHER = new PropAsset("/models/weapons/rpg.glb", { length: 1.4 });

export function preloadWeapons() { return LAUNCHER.preload(); }
export function makeLauncher() { return LAUNCHER.make(); }
