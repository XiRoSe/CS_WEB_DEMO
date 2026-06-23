import { PropAsset } from "../../engine/assets.js";

// Low-poly CC0 nature props (Quaternius) for island/outdoor levels.
const PALM = new PropAsset("/models/nature/palm.glb", { height: 7 });
const TREE = new PropAsset("/models/nature/tree.glb", { height: 8 });
const ROCK1 = new PropAsset("/models/nature/rock1.glb", { length: 2.6 });
const ROCK2 = new PropAsset("/models/nature/rock2.glb", { length: 3.6 });

export function preloadNature() { return Promise.all([PALM, TREE, ROCK1, ROCK2].map((a) => a.preload())); }
export function makeTree(kind = "tree") { return (kind === "palm" ? PALM : TREE).make(); }
export function makeRock(i = 0) { return (i % 2 ? ROCK2 : ROCK1).make(); }
