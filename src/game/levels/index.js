import { compound } from "./compound.js";
import { desertBase } from "./desert-base.js";
import { arcfall } from "./arcfall.js";

// Level registry. Add a level here and it's selectable via ?level=<id>.
export const levels = {
  compound,
  "desert-base": desertBase,
  arcfall,
};
export const DEFAULT_LEVEL = "desert-base";
