// "Defuse the bomb" objective: timed; reach the bomb and crack a self-working "mentalist" code.
// The runner (main.js) owns the win/lose/detonate STATE transitions; this owns the win/lose CONDITIONS
// and the defuse-panel UI. Implements the objective interface: brief(), onPlayStart(), update().
export class DefuseObjective {
  constructor(game) {
    this.game = game;
    const o = game.cfg.objective;
    this.bombTime = o.timeLimit;
    this.maxTries = o.maxTries || 3;
    this.codeTries = 0;
    this.defusing = false; this.defused = false; this.codeTyped = ""; this.codeFeedback = "";
    // A self-working "mentalist" lock: the player's personal number cancels out, so EVERYONE
    // lands on our exact code N:  ((x * m) + m*N) / m - x  ===  N   for any x, any m.
    const N = 100 + Math.floor(Math.random() * 900);
    this.code = String(N);
    this.codeLen = 3;
    const m = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const personals = [
      "the day of the month you were born", "your age", "your house number",
      "the last two digits of your phone number", "your lucky number",
    ];
    const who = personals[Math.floor(Math.random() * personals.length)];
    this.hint =
      `<b>NEURAL KEY · unique to you</b><br>` +
      `① think of <b>${who}</b> (keep it secret)<br>` +
      `② multiply it by ${m}<br>` +
      `③ add ${m * N}<br>` +
      `④ divide by ${m}<br>` +
      `⑤ subtract the number you started with<br>` +
      `▶ what remains is the 3-digit disarm code`;
  }

  brief() { return "Infiltrate the base and disarm the bomb before it detonates."; }

  onPlayStart() {
    const g = this.game;
    g.hud.showTimer(true);
    g.hud.setMissionTimer(this.bombTime);
    g.hud.setObjective('Reach &amp; disarm the <span class="arrow">BOMB ◎</span>');
    g.hud.setCounter("Eliminated", g.combat.killCount);
  }

  update(dt, t, presses) {
    const g = this.game;
    this.bombTime -= dt;
    g.hud.setMissionTimer(this.bombTime);
    g.hud.setCounter("Eliminated", g.combat.killCount);
    if (this.bombTime <= 0) { g._detonate(); return; }
    if (this.defused) return;

    const bmb = g.level.bomb;
    const dx = g.camera.position.x - bmb.x, dz = g.camera.position.z - bmb.z;
    const near = (dx * dx + dz * dz) < bmb.r * bmb.r;
    if (near && !this.defusing) {
      this.defusing = true; this.codeTyped = "";
      this.codeFeedback = this.hint;
      g.hud.showDefuse(this.codeLen); g.hud.updateDefuse("", this.codeFeedback);
    } else if (!near && this.defusing) {
      this.defusing = false; g.hud.hideDefuse();
    }

    if (this.defusing && presses.length) {
      for (const k of presses) {
        if (/^[0-9]$/.test(k)) { if (this.codeTyped.length < this.codeLen) this.codeTyped += k; }
        else if (k === "backspace") this.codeTyped = this.codeTyped.slice(0, -1);
        else if (k === "enter" && this.codeTyped.length === this.codeLen) {
          let correct = 0;
          for (let i = 0; i < this.codeLen; i++) if (this.codeTyped[i] === this.code[i]) correct++;
          if (correct === this.codeLen) {
            const left = Math.max(0, this.bombTime), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
            this.defused = true;
            g.hud.hideDefuse();
            g._win({ disarmed: true, timeLeft: `${mm}:${String(ss).padStart(2, "0")}`, title: 'Bomb <span class="hz">Disarmed</span>' });
            return;
          }
          this.codeTries++;
          if (this.codeTries >= this.maxTries) { g.hud.hideDefuse(); g._detonate(); return; }
          this.codeFeedback = `<b class="bad">✗ WRONG · ${this.codeTries}/${this.maxTries}</b><br>${this.hint}`;
          this.codeTyped = "";
        }
      }
      g.hud.updateDefuse(this.codeTyped, this.codeFeedback);
    }
  }
}
