// "Recover the lost arcs" objective + the ARCFALL storyline: the rogue AI THE VAULT shattered reality
// into 12 Arcs across a guardian island; recover them all (fighting its legion + the beasts) to seal the
// breach. Implements the objective interface: brief(), onPlayStart(), update().
export class CollectObjective {
  constructor(game) {
    this.game = game;
    this.total = game.cfg.objective.count || 12; // arcs are placed during level build (after this runs)
    this.collected = 0;
    // story beats fired as Arcs are recovered — each names a tribe whose territory holds the next Arcs
    this.beats = {
      1: "ARC ONLINE — THE VAULT HAS NOTICED YOU",
      3: "NW · THE SAURIAN BROOD WAKES IN THE RUINS",
      5: "NE · THE IRON LEGION MOBILIZES",
      7: "SE · THE HOLLOW WATCH LOCKS ONTO YOU",
      9: "S · THE VAULT GARRISON RINGS THE PALACE",
      11: "ONE ARC REMAINS — THE GUARDIAN STIRS",
    };
  }

  brief() {
    return `The rogue AI <b>THE VAULT</b> shattered reality into 12 Arcs and scattered them across this island — ` +
      `held by four tribes: the <b>Saurian Brood</b> (NW), the <b>Iron Legion</b> (NE), the <b>Hollow Watch</b> (SE), ` +
      `and the <b>Vault Garrison</b> guarding the palace. You're the last operator standing. ` +
      `Recover all ${this.total} Arcs to seal the breach.`;
  }

  onPlayStart() {
    this.game.hud.setObjective('Recover the lost <span class="arrow">ARCS ✦</span>');
    this.game.hud.setCounter("Arcs", `${this.collected} / ${this.total}`);
    this.game.hud.notify("SEAL THE BREACH — RECOVER THE 12 ARCS");
  }

  update(dt, t, presses) {
    const g = this.game, pp = g.driving ? g.driving.pos : g.camera.position; // works on foot or while driving
    // region-entry callout: name the tribe's territory + how many Arcs remain there
    const q = pp.x < 0 ? (pp.z >= 0 ? "NW" : "SW") : (pp.z >= 0 ? "NE" : "SE");
    if (q !== this._region) {
      this._region = q;
      const names = { NW: "NORTH RUINS · SAURIAN BROOD", NE: "EAST HIGHLANDS · IRON LEGION", SE: "SOUTH FLATS · HOLLOW WATCH", SW: "PALACE APPROACH · VAULT GARRISON" };
      const left = g.level.arcs.filter((a) => !a.taken && (a.x < 0 ? (a.z >= 0 ? "NW" : "SW") : (a.z >= 0 ? "NE" : "SE")) === q).length;
      g.hud.notify(`◆ ${names[q]} — ${left} ARC${left === 1 ? "" : "S"} HERE`);
    }
    for (const a of g.level.arcs) {
      if (a.taken) continue;
      const dx = pp.x - a.x, dz = pp.z - a.z;
      if (dx * dx + dz * dz < a.r * a.r) {
        a.taken = true; a.group.visible = false;
        this.collected++;
        g.audio.arcGet?.();
        g.hud.notify(`✦ ARC RECOVERED · ${this.collected}/${this.total}`);
        g.hud.setCounter("Arcs", `${this.collected} / ${this.total}`);
        if (this.beats[this.collected]) g.hud.notify(this.beats[this.collected]);
        if (this.collected >= this.total) {
          g._win({ title: 'Reality <span class="hz">Saved</span>', sub: `The breach is sealed — all ${this.total} Arcs recovered` });
          return;
        }
      }
    }
  }
}
