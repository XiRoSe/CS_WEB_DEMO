// ARCFALL — a sculpted daytime island: parachute in, hunt the 12 lost arcs, survive the monsters and
// giant robots guarding them. The world build is exported as buildArcfallIsland() so re-skins (e.g. the
// Rick & Morty level) can reuse the exact island + arcs + weapon economy with a different boss/enemies.
export const arcfall = {
  id: "arcfall",
  name: "ARCFALL",
  config: {
    scene: { sky: "day", fog: { color: 0x9a7fb0, near: 240, far: 1300 }, fov: 75 },
    intro: { enabled: true, style: "droppod", spottedCalloutAt: 4.5 },
    objective: { type: "collect", count: 12 },
    helicopter: { spawnDelay: 99999 },
    player: { grenades: 4, startLoadout: ["sword"] },
    messages: { deployHint: "DROP POD INBOUND — click to skip" },
  },
  build(b) { buildArcfallIsland(b); },
};

// The shared island world. `bossKind` picks the palace guardian ("robot" = the giant mech; "meeseeks" = a
// huge Mr. Meeseeks). Everything else (terrain, landmarks, the 12 arcs, the scattered weapon economy) is identical.
export function buildArcfallIsland(b, { bossKind = "robot" } = {}) {
  b.spawnAt(0, 156);   // dry south shore just above the waterline
  b.setBounds({ minX: -320, maxX: 320, minZ: -320, maxZ: 320 });
  b.lake(-46, 20, 18, 1.5); b.lake(70, -64, 22, 1.6); b.lake(30, 90, 16, 1.4); // shallow wadeable lakes (carved first)
  b.lake(-78, 50, 20, 1.7);
  b.islandTerrain({ size: 460 });
  b.scatterTrees(110, 20, 198);
  b.scatterRocks(46, 24, 200);
  b.palace(40, -64);
  b.ruin(-44, 82); b.ruin(76, 44); b.ruin(8, -110); b.ruin(-128, 30);
  b.hut(-92, 8); b.hut(52, -92); b.hut(-18, -82); b.hut(104, 8); b.hut(-70, -88);
  b.obelisk(112, -52); b.obelisk(-112, -12); b.obelisk(20, 110); b.obelisk(64, 96); b.obelisk(-96, 70);
  // section barriers (each tribe's territory)
  b.sectionForest(-68, 46, 46, 4);
  b.sectionWalls(92, 54, 58, 4);
  b.sectionPylons(66, -44, 48, 3);
  b.sectionWalls(-84, -40, 48, 3);
  for (const [x, z] of [[96, 40], [112, 58], [84, 66], [100, 76]]) b.obelisk(x, z);
  b.ruin(106, 48);
  // time-broken landmarks: skyscrapers, pyramids + a frozen Big Ben
  b.clockTower(0, 6);
  b.skyscraper(112, 128, "b6", 0);
  b.skyscraper(-120, 80, "b2", 0);
  b.skyscraper(-128, -58, "b4", 0);
  b.skyscraper(152, 24, "b3", 0);
  b.pyramid(-150, 14, 27); b.pyramid(40, -120, 23); b.pyramid(52, 122, 26);

  // the 12 lost arcs, scattered wide (each beams to the sky so it's findable from a hilltop)
  const arcs = [[0, -44], [44, -22], [-30, -18], [74, 22], [-68, 16], [32, 58],
                [-44, 64], [90, -58], [-86, -52], [112, 48], [-118, -32], [16, 96]];
  for (const [x, z] of arcs) b.arc(x, z);

  // THE GUARDIAN boss waits at the palace; reinforcements DROP from the sky during play (main._dropReinforcement)
  b.enemy(bossKind === "meeseeks"
    ? { kind: "meeseeks", x: 44, z: -24, hp: 650, huge: true, boss: true }
    : { kind: "robot", x: 44, z: -24, hp: 1600, scale: 2.0, boss: true });

  // gift crates (loot: ammo / health / grenades + sci-fi weapons to find)
  b.giftCrate(8, -22, "ammo"); b.giftCrate(-22, 27, "health"); b.giftCrate(48, 42, "grenade");
  b.giftCrate(-62, -16, "ammo"); b.giftCrate(96, 12, "health"); b.giftCrate(-100, -26, "grenade");
  for (const [x, z] of [[-84, 58], [108, 50], [86, -64], [-96, -46], [20, 98], [56, 8], [-40, -64]]) b.giftCrate(x, z, "ammo");
  for (const [x, z] of [[30, 60], [-60, 30], [80, -20], [-30, -70], [110, 70], [-110, 10], [10, 130], [-20, -10]]) b.giftCrate(x, z, "health");
  for (const [x, z] of [[50, 20], [-70, -20], [95, 35], [-40, 75], [25, -60], [-100, 50]]) b.giftCrate(x, z, "armor");
  // SCATTERED GUNS — start with only the staff; find ALL guns around the island
  for (const [x, z] of [[22, 30], [-60, 40], [82, -8]]) b.giftCrate(x, z, "rifle");
  for (const [x, z] of [[14, -36], [-40, 70], [104, 36]]) b.giftCrate(x, z, "smg");
  for (const [x, z] of [[-46, 8], [40, -72], [112, 60]]) b.giftCrate(x, z, "laser");
  for (const [x, z] of [[-72, 52], [-96, -36]]) b.giftCrate(x, z, "minigun");
  for (const [x, z] of [[60, -28], [12, 72]]) b.giftCrate(x, z, "plasma");
  for (const [x, z] of [[-110, 24], [70, 96]]) b.giftCrate(x, z, "burst");
  for (const [x, z] of [[120, -36], [-30, -90]]) b.giftCrate(x, z, "flak");
  b.giftCrate(96, 70, "railgun");
  b.giftCrate(-20, 100, "launcher");
}
