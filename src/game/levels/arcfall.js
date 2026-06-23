import { COLORS } from "../../engine/primitives.js";

// "The Lost Arcs" — a daytime island: parachute in, hunt the 12 lost arcs, fight whatever's guarding
// them. A different game on the same engine/kit (Fortnite-drop × Helldivers-solo flavored).
export const arcfall = {
  id: "arcfall",
  name: "ARCFALL",
  config: {
    scene: { sky: "day", fog: { color: 0xbfe0f4, near: 160, far: 700 }, fov: 75 },
    intro: { enabled: true, style: "parachute", spottedCalloutAt: 4.5 },
    objective: { type: "collect", count: 12 },
    helicopter: { spawnDelay: 99999 }, // no gunship boss on the island (for now)
    player: { grenades: 4 },
    messages: { deployHint: "PARACHUTE DROP — click to skip" },
  },

  build(b) {
    b.spawnAt(0, 0);
    b.setBounds({ minX: -240, maxX: 240, minZ: -240, maxZ: 240 });
    b.grassFloor(440, 3200);
    b.scatterTrees(80, 16, 210);

    // ruins / structures — cover + landmarks
    b.building(60, -42, 14, 10, 5, COLORS.concrete);
    b.building(-72, 32, 12, 12, 6);
    b.tower(42, 62); b.tower(-52, -64);
    b.bunker(105, -10);
    b.crateStack(10, 10, "stack"); b.crateStack(-16, -9, "pair"); b.crateStack(70, 30, "single");
    b.barrels(22, -14, 3); b.fuelTanks(-32, -52, 2); b.barrels(96, -6, 3);

    // the 12 lost arcs, scattered wide (each beams to the sky so it's findable)
    const arcs = [[0, -44], [44, -22], [-38, -26], [74, 22], [-68, 16], [32, 58],
                  [-44, 64], [90, -58], [-86, -52], [118, 42], [-118, -32], [16, 96]];
    for (const [x, z] of arcs) b.arc(x, z);

    // gift crates (loot)
    b.giftCrate(8, -22, "ammo"); b.giftCrate(-22, 27, "health"); b.giftCrate(48, 42, "grenade");
    b.giftCrate(-62, -16, "ammo"); b.giftCrate(96, 12, "health"); b.giftCrate(-100, -26, "grenade");

    // hostiles: raptors + spiders charge you, raiders shoot, a T-Rex roams, a giant mech guards a far arc
    const raptors = [[18, -26], [-24, -18], [40, 48], [-40, 58], [78, -46], [12, 70]];
    for (const [x, z] of raptors) b.enemy({ kind: "monster", x, z });
    const spiders = [[-30, 40], [60, -20], [-90, -20], [30, -55]];
    for (const [x, z] of spiders) b.enemy({ kind: "spider", x, z });
    const raiders = [[-26, -22], [56, -34], [-60, 26], [-76, -40], [100, 30]];
    for (const [x, z] of raiders) b.enemy({ x, z, patrol: [{ x, z }, { x: x + 6, z: z + 4 }], hp: 100, speed: 2.6 });
    b.enemy({ kind: "trex", x: -110, z: 60 });            // T-Rex mini-boss roaming the far side
    b.enemy({ kind: "robot", x: 118, z: 46 });            // giant mech guarding a far arc
  },
};
