// "Recover the lost arcs" objective + the ARCFALL storyline: the rogue AI THE VAULT shattered reality
// into 12 Arcs across a guardian island; recover them all (fighting its legion + the beasts) to seal the
// breach. Implements the objective interface: brief(), onPlayStart(), update().
export class CollectObjective {
  constructor(game) {
    this.game = game;
    this.total = game.cfg.objective.count || 12; // arcs are placed during level build (after this runs)
    this.collected = 0;
    // story beats fired as Arcs are recovered
    this.beats = {
      1: "ARC ONLINE — THE VAULT HAS NOTICED YOU",
      4: "THE VAULT UNLEASHES ITS LEGION",
      8: "THE BREACH DESTABILIZES — RECOVER THE REST",
      11: "ONE ARC REMAINS — THE GUARDIAN STIRS",
    };
  }

  brief() {
    return `The rogue AI <b>THE VAULT</b> shattered reality into 12 Arcs and scattered them across this guardian island — ` +
      `defended by its robot legion and ancient beasts. You're the last operator standing. ` +
      `Recover all ${this.total} Arcs to seal the breach and save reality.`;
  }

  onPlayStart() {
    this.game.hud.setObjective('Recover the lost <span class="arrow">ARCS ✦</span>');
    this.game.hud.setCounter("Arcs", `${this.collected} / ${this.total}`);
    this.game.hud.notify("SEAL THE BREACH — RECOVER THE 12 ARCS");
  }

  update(dt, t, presses) {
    const g = this.game, pp = g.driving ? g.driving.pos : g.camera.position; // works on foot or while driving
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
