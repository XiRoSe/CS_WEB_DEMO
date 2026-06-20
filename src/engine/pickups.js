import { PropAsset } from "./actor.js";

// Pickups for this game. Low-poly CC0 assault-rifle ammo box.
const AMMO = new PropAsset("/models/ammo.glb", { length: 0.55 });

export function preloadPickups() { return AMMO.preload(); }
export function makeAmmo() { return AMMO.make(); }
