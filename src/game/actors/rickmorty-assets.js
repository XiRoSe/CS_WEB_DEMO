import { PropAsset } from "../../engine/assets.js";

// Model pack for the Rick & Morty level. These load real GLBs dropped into public/models/ (see the
// download instructions). If a file is missing, the actor falls back to its procedural homage model,
// so the game always runs. PropAsset normalizes each GLB to a target height + seats it on the ground.
export const RICK_MODEL = new PropAsset("/models/rick.glb", { height: 1.95 });
export const MEESEEKS_MODEL = new PropAsset("/models/meeseeks.glb", { height: 2.0 });

// preload both (call at boot for the Rick level). 404s resolve quietly → `.ready` stays false → fallback.
export function preloadRickMorty() {
  return Promise.all([RICK_MODEL.preload(), MEESEEKS_MODEL.preload()]);
}
