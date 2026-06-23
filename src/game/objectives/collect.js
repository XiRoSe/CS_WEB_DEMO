// "Recover the lost arcs" objective: find and walk over every arc relic on the map to win.
// Implements the objective interface: brief(), onPlayStart(), update().
export class CollectObjective {
  constructor(game) {
    this.game = game;
    this.total = game.cfg.objective.count || 12; // arcs are placed during level build (after this runs)
    this.collected = 0;
  }

  brief() { return `Parachute onto the island and recover the ${this.total} lost arcs to save reality. Anything in your way is hostile.`; }

  onPlayStart() {
    this.game.hud.setObjective('Recover the lost <span class="arrow">ARCS ✦</span>');
    this.game.hud.setCounter("Arcs", `${this.collected} / ${this.total}`);
  }

  update(dt, t, presses) {
    const g = this.game;
    for (const a of g.level.arcs) {
      if (a.taken) continue;
      const dx = g.camera.position.x - a.x, dz = g.camera.position.z - a.z;
      if (dx * dx + dz * dz < a.r * a.r) {
        a.taken = true; a.group.visible = false;
        this.collected++;
        g.audio.hitmarker?.(true);
        g.hud.notify(`✦ ARC RECOVERED · ${this.collected}/${this.total}`);
        g.hud.setCounter("Arcs", `${this.collected} / ${this.total}`);
        if (this.collected >= this.total) {
          g._win({ title: 'Reality <span class="hz">Saved</span>', sub: `All ${this.total} lost arcs recovered` });
          return;
        }
      }
    }
  }
}
