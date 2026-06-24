import { PropAsset } from "../../engine/assets.js";

// Low-poly CC0 city buildings (Quaternius) — scaled tall to read as skyscrapers; a bell tower for Big Ben.
const SKY = {
  b1: new PropAsset("/models/buildings/b1.glb", { height: 36 }),
  b2: new PropAsset("/models/buildings/b2.glb", { height: 32 }),
  b3: new PropAsset("/models/buildings/b3.glb", { height: 28 }),
  b4: new PropAsset("/models/buildings/b4.glb", { height: 30 }),
  b6: new PropAsset("/models/buildings/b6story.glb", { height: 34 }),
  bell: new PropAsset("/models/buildings/belltower.glb", { height: 30 }),
};

export function preloadBuildings() { return Promise.all(Object.values(SKY).map((a) => a.preload())); }
export function makeBuilding(kind = "b1") { return (SKY[kind] || SKY.b1).make(); }
