import { PropAsset } from "../../engine/assets.js";

// This game's vehicle catalog — low-poly CC0 models (Kenney car kit), scaled to real lengths
// and tinted toward military olive/sand so they read as base vehicles, not toys.
const CATALOG = {
  truck: new PropAsset("/models/vehicles/truck.glb", { length: 5.0 }),
  flatbed: new PropAsset("/models/vehicles/truckFlat.glb", { length: 5.2 }),
  suv: new PropAsset("/models/vehicles/suv.glb", { length: 4.3 }),
  van: new PropAsset("/models/vehicles/van.glb", { length: 4.6 }),
  tank: new PropAsset("/models/vehicles/tank.glb", { length: 6.6 }),
  tank2: new PropAsset("/models/vehicles/tank2.glb", { length: 6.9 }),
  racefuture: new PropAsset("/models/vehicles/racefuture.glb", { length: 4.6 }), // fast sports/race cars
  race: new PropAsset("/models/vehicles/race.glb", { length: 4.4 }),
  sportscar: new PropAsset("/models/vehicles/sportscar.glb", { length: 4.6 }),
};
const TINT = { truck: 0x5b6140, flatbed: 0x6b6450, suv: 0x4f5640, van: 0x6a6a5a }; // tanks keep their own colors

export function preloadVehicles() { return Promise.all(Object.values(CATALOG).map((a) => a.preload())); }

// returns a placed-ready Group (origin on the ground at the vehicle's center)
export function makeVehicle(type = "truck") {
  const asset = CATALOG[type] || CATALOG.truck;
  return asset.make({ tint: TINT[type] });
}
