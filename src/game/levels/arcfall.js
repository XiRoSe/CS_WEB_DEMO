// ARCFALL — a sculpted daytime island: parachute in, hunt the 12 lost arcs, survive the monsters and
// giant robots guarding them. A different game on the same engine/kit (Fortnite-drop × Helldivers-solo).
export const arcfall = {
  id: "arcfall",
  name: "ARCFALL",
  config: {
    scene: { sky: "day", fog: { color: 0xbfe0f4, near: 160, far: 700 }, fov: 75 },
    intro: { enabled: true, style: "droppod", spottedCalloutAt: 4.5 },
    objective: { type: "collect", count: 12 },
    helicopter: { spawnDelay: 99999 }, // no gunship boss on the island (for now)
    player: { grenades: 4 },
    messages: { deployHint: "PARACHUTE DROP — click to skip" },
  },

  build(b) {
    b.spawnAt(0, 0);
    b.setBounds({ minX: -320, maxX: 320, minZ: -320, maxZ: 320 }); // extends into the sea so you can swim around the island
    b.lake(-46, 20, 18, 1.5); b.lake(70, -64, 22, 1.6); b.lake(30, 90, 16, 1.4); // shallow wadeable lakes (carved first)
    b.islandTerrain({ size: 460 });   // hills → beach → sea → distant mountains
    b.scatterTrees(120, 20, 198);     // GLB forest (birch + palms), seated on the terrain (perf-tuned)
    b.scatterRocks(28, 26, 198);      // GLB rocks (cover + dressing)
    b.palace(40, -64);          // grand temple you can climb the stairs into (glowing relic inside)
    // structures from across the ages, scattered for landmarks + cover
    b.ruin(-44, 82); b.ruin(76, 44);
    b.hut(-92, 8); b.hut(52, -92); b.hut(-18, -82);
    b.obelisk(112, -52); b.obelisk(-112, -12); b.obelisk(20, 110);
    b.car(9, 13, "racefuture"); b.car(-12, 7, "sportscar"); b.car(2, -15, "race"); // fast sports cars in the clear drop zone (press E)

    // the 12 lost arcs, scattered wide (each beams to the sky so it's findable from a hilltop)
    const arcs = [[0, -44], [44, -22], [-38, -26], [74, 22], [-68, 16], [32, 58],
                  [-44, 64], [90, -58], [-86, -52], [118, 42], [-118, -32], [16, 96]];
    for (const [x, z] of arcs) b.arc(x, z);

    // gift crates (loot: ammo / health / grenades + two sci-fi weapons to find)
    b.giftCrate(8, -22, "ammo"); b.giftCrate(-22, 27, "health"); b.giftCrate(48, 42, "grenade");
    b.giftCrate(-62, -16, "ammo"); b.giftCrate(96, 12, "health"); b.giftCrate(-100, -26, "grenade");
    b.giftCrate(24, 14, "plasma");   // PLASMA CANNON near the drop
    b.giftCrate(-50, 70, "laser");   // LASER RIFLE out by the lake
    b.giftCrate(64, 30, "shotgun");  // PULSE SHOTGUN

    // ─── THE FOUR TRIBES — each faction holds a different region of the island ───
    // NW · THE SAURIAN BROOD — beasts the anomaly twisted; they overran the old northern ruins
    b.enemy({ kind: "trex", x: -122, z: 70 });   // the Brood's apex predator
    for (const [x, z] of [[-72, 56], [-96, 30], [-54, 78], [-112, 48], [-80, 90]]) b.enemy({ kind: "monster", x, z });
    // NE · THE IRON LEGION — the Vault's heavy war-machines, guarding the richest Arcs
    b.enemy({ kind: "robot", x: 126, z: 56 }); b.enemy({ kind: "robot", x: 112, z: 22 });
    for (const [x, z] of [[92, 70], [120, 36], [78, 92]]) b.enemy({ kind: "heavy", x, z });
    // SE · THE HOLLOW WATCH — automated sentinels + drones patrolling the southern flats
    for (const [x, z] of [[70, -40], [104, -64], [44, -86]]) b.enemy({ kind: "sentry", x, z });
    for (const [x, z] of [[86, -22], [56, -70]]) b.enemy({ kind: "drone", x, z });
    // S / CENTRE · THE VAULT GARRISON — corrupted human soldiers ringing the palace (Vault core)
    for (const [x, z] of [[36, -46], [-30, -50], [60, -78], [12, -64], [-14, -38]]) {
      b.enemy({ x, z, hp: 100, speed: 2.6, patrol: [{ x, z }, { x: x + 6, z: z + 5 }] });
    }
    // THE GUARDIAN — a colossal boss mech standing before the palace
    b.enemy({ kind: "robot", x: 40, z: -48, hp: 1600, scale: 2.0, boss: true });
  },
};
