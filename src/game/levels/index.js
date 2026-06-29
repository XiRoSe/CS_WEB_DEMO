import { compound } from "./compound.js";
import { desertBase } from "./desert-base.js";
import { arcfall } from "./arcfall.js";
import { meeseeks } from "./meeseeks.js";

// Level registry. Add a level here and it's selectable via ?level=<id>.
export const levels = {
  compound,
  "desert-base": desertBase,
  arcfall,
  arcfall_rick_and_morty: meeseeks,
};
export const DEFAULT_LEVEL = "desert-base";
