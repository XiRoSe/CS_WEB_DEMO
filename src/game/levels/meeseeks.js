// MEESEEKS MAYHEM — a 3rd-person arena: you're Rick (portal gun = the laser), a swarm of Mr. Meeseeks
// wants out of existence and will swat you to get there. Wipe them all out, then step into the return
// portal. A different game on the same engine (3rd-person view, procedural Rick + Meeseeks).
export const meeseeks = {
  id: "arcfall_rick_and_morty",
  name: "MEESEEKS MAYHEM",
  config: {
    view: "third",                                              // 3rd-person camera + visible player avatar (Rick)
    scene: { sky: "day", fog: { color: 0x9fc7e6, near: 140, far: 760 }, fov: 72 },
    intro: { enabled: false },                                  // straight into play (no drop-pod cinematic)
    objective: { type: "exfil" },                               // clear every Meeseeks, then reach the portal
    player: { maxHealth: 150, regenInterval: 4, regenAmount: 8, grenades: 5, startLoadout: ["laser", "launcher"] },
    helicopter: { spawnDelay: 99999 },                          // no gunship here
    messages: { deployHint: "CLICK TO ENTER — wipe out the Meeseeks", hostileDown: "MEESEEKS POOFED" },
  },

  build(b) {
    b.spawnAt(0, 44);
    b.setBounds({ minX: -120, maxX: 120, minZ: -120, maxZ: 120 });
    b.desertFloor(120, 14, 60, 900);
    b.scatterDesert(70, 118, 80, 120);

    // a fenced backyard arena (open on the player's side)
    b.wall(-58, 0, 1, 116, 3); b.wall(58, 0, 1, 116, 3); b.wall(0, -58, 116, 1, 3);

    // junk cover + explosive barrels (Meeseeks love crowding behind them)
    for (const [x, z] of [[-22, 8], [18, -2], [-8, -24], [30, 16], [-34, -12], [12, 26]]) b.crateStack(x, z, "pyramid");
    b.barrels(10, 18, 4); b.barrels(-26, 14, 3); b.fuelTanks(36, -20, 2);
    b.tower(-46, -36); b.tower(46, -36);
    b.floodlight(0, 22, 8, 0, 0, true, 95);

    // the RETURN PORTAL — the exfil target you reach after the swarm is cleared
    b.objective(0, -50, 5);

    // the Meeseeks swarm — they idle until you get close, then mob you
    const spots = [[-30, -22], [30, -22], [-15, -36], [15, -36], [0, -46], [-42, -2], [42, -2],
                   [-20, 6], [20, 6], [0, -12], [-46, -30], [46, -30], [-10, -30], [10, -30]];
    for (const [x, z] of spots) b.enemy({ kind: "meeseeks", x, z });
  },
};
