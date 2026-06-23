import { compound } from "./compound.js";
import { desertBase } from "./desert-base.js";
import { arcIsland } from "./arc-island.js";

// Level registry. Add a level here and it's selectable via ?level=<id>.
export const levels = {
  compound,
  "desert-base": desertBase,
  "arc-island": arcIsland,
};
export const DEFAULT_LEVEL = "desert-base";
