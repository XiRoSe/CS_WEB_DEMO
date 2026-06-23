import { PropAsset } from "../../engine/assets.js";

// Player weapon models for this game. Low-poly CC0 military rocket launcher (first-person viewmodel).
const LAUNCHER = new PropAsset("/models/weapons/launcher.glb", { length: 1.5 });

export function preloadWeapons() { return LAUNCHER.preload(); }
export function makeLauncher() { return LAUNCHER.make(); }
