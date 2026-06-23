// "Clear & extract" objective: eliminate every hostile (incl. the gunship), then reach the exfil flag.
// Implements the objective interface: brief(), onPlayStart(), update().
export class ExfilObjective {
  constructor(game) { this.game = game; this._cleared = undefined; }

  brief() { return "Push to the extraction zone. Eliminate anyone in your way."; }

  onPlayStart() { this.game.hud.setCounter("Hostiles", this.game.combat.enemiesLeft); }

  update(dt, t, presses) {
    const g = this.game;
    const heliAlive = g.heli && !g.heli.dead;
    const cleared = g.combat.enemiesLeft === 0 && !heliAlive;
    g.hud.setCounter("Hostiles", g.combat.enemiesLeft + (heliAlive ? 1 : 0));
    if (cleared !== this._cleared) {
      this._cleared = cleared;
      g.hud.setObjective(cleared ? g.cfg.messages.objectiveCleared : g.cfg.messages.objective);
    }
    if (cleared) {
      const e = g.level.exfil;
      const dx = g.camera.position.x - e.x, dz = g.camera.position.z - e.z;
      if (dx * dx + dz * dz < e.r * e.r) g._win();
    }
  }
}
