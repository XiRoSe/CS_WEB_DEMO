// ARCFALL — a sculpted daytime island: parachute in, hunt the 12 lost arcs, survive the monsters and
// giant robots guarding them. A different game on the same engine/kit (Fortnite-drop × Helldivers-solo).
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
    b.setBounds({ minX: -205, maxX: 205, minZ: -205, maxZ: 205 });
    b.lake(-46, 20, 18, 1.5); b.lake(70, -64, 22, 1.6); b.lake(30, 90, 16, 1.4); // shallow wadeable lakes (carved first)
    b.islandTerrain({ size: 460 });   // hills → beach → sea → distant mountains
    b.scatterTrees(110, 22, 195);     // GLB forest (birch + palms), seated on the terrain
    b.scatterRocks(45, 26, 195);      // GLB rocks (cover + dressing)

    // the 12 lost arcs, scattered wide (each beams to the sky so it's findable from a hilltop)
    const arcs = [[0, -44], [44, -22], [-38, -26], [74, 22], [-68, 16], [32, 58],
                  [-44, 64], [90, -58], [-86, -52], [118, 42], [-118, -32], [16, 96]];
    for (const [x, z] of arcs) b.arc(x, z);

    // gift crates (loot: ammo / health / grenades)
    b.giftCrate(8, -22, "ammo"); b.giftCrate(-22, 27, "health"); b.giftCrate(48, 42, "grenade");
    b.giftCrate(-62, -16, "ammo"); b.giftCrate(96, 12, "health"); b.giftCrate(-100, -26, "grenade");

    // hostiles — all terrain-following: raptors + spiders charge, a T-Rex roams, a giant mech guards a far arc
    const raptors = [[18, -26], [-24, -18], [40, 48], [-40, 58], [78, -46], [12, 70], [-70, 40], [64, 8]];
    for (const [x, z] of raptors) b.enemy({ kind: "monster", x, z });
    const spiders = [[-30, 40], [60, -20], [-90, -20], [30, -55], [-50, -10], [100, -30]];
    for (const [x, z] of spiders) b.enemy({ kind: "spider", x, z });
    b.enemy({ kind: "trex", x: -112, z: 64 });   // T-Rex mini-boss roaming the far side
    b.enemy({ kind: "robot", x: 118, z: 48 });    // giant mech guarding a far arc
  },
};
