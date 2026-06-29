import { RiggedAsset } from "../../engine/assets.js";

// Rigged model pack for the Rick & Morty level (Mesh2Motion human skeleton, bone "hand_r" = right hand).
// Animations are split across files; we load them all and combine the clips onto one mixer per character:
//   Rick:     rick.glb (Walk_Loop) + rick_shoot.glb (Pistol_Shoot)
//   Meeseeks: meeseeks.glb (Walk_Loop, Zombie_Walk_Fwd_Loop) + meeseeks_dead.glb (Hit_Knockback_RM)
export const RICK_MODEL = new RiggedAsset("/models/rick.glb", 1.95);
export const RICK_SHOOT = new RiggedAsset("/models/rick_shoot.glb", 1.95);
export const MEESEEKS_MODEL = new RiggedAsset("/models/meeseeks.glb", 2.0);
export const MEESEEKS_DEAD = new RiggedAsset("/models/meeseeks_dead.glb", 2.0);
export const RM_HAND_BONE = "hand_r";

export function preloadRickMorty() {
  return Promise.all([RICK_MODEL.preload(), RICK_SHOOT.preload(), MEESEEKS_MODEL.preload(), MEESEEKS_DEAD.preload()]);
}

// pull extra animation clips off an already-preloaded RiggedAsset (same skeleton → they retarget by bone name)
export function clipsOf(asset) { return (asset._asset && asset._asset.animations) || []; }
