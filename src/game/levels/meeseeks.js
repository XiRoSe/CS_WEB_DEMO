import { buildArcfallIsland } from "./arcfall.js";

// MEESEEKS MAYHEM — ARCFALL, re-skinned for Rick & Morty: it's the same island + the 12 arcs + the
// scavenged-weapon economy, but you're RICK (3rd-person, visible, holding a gun) and the guardians are
// Mr. MEESEEKS — regular ones plus HUGE tanky ones. Existing weapons only (Arc Blade + scattered guns).
export const meeseeks = {
  id: "arcfall_rick_and_morty",
  name: "MEESEEKS MAYHEM",
  config: {
    view: "third",                                              // 3rd-person: you see Rick + his gun
    scene: { sky: "day", fog: { color: 0x9a7fb0, near: 240, far: 1300 }, fov: 75 },
    intro: { enabled: false },                                  // straight into play (no drop-pod cinematic)
    objective: { type: "collect", count: 12 },                  // recover the 12 arcs, same as ARCFALL
    helicopter: { spawnDelay: 99999 },
    player: { grenades: 4, startLoadout: ["sword"] },           // existing weapons: Arc Blade start, scavenge the rest
    reinforce: "meeseeks",                                      // the sky-drop reinforcements are Meeseeks (mostly regular, some huge)
    messages: { deployHint: "CLICK TO DEPLOY — recover the arcs, survive the Meeseeks", hostileDown: "MEESEEKS POOFED" },
  },

  build(b) {
    buildArcfallIsland(b, { bossKind: "meeseeks" });            // the full ARCFALL island + arcs + weapons, with a HUGE Meeseeks guardian
    // a welcome party near the south-shore drop: regular Meeseeks + a couple of huge ones
    for (const [x, z] of [[10, 122], [-14, 118], [22, 104], [-30, 100], [2, 96], [36, 110], [-44, 106], [16, 108]]) b.enemy({ kind: "meeseeks", x, z });
    for (const [x, z] of [[26, 90], [-26, 88]]) b.enemy({ kind: "meeseeks", huge: true, x, z });
  },
};
