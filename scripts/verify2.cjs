const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

async function probe(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.combat, null, { timeout: 90000 });
  return page.evaluate(() => {
    const g = window.__game;
    g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
    const out = { badass: !!g.vfx._badass };
    if (g.combat && g.level) {
      g.combat.enemies.length = 0;
      const gy = g.level.terrainHeight ? g.level.terrainHeight(0, 140) : 0;
      const mz = g.combat.spawnEnemy({ kind: "meeseeks", weapon: "gun", x: 0, z: 140 });
      if (mz) {
        mz.aggro = true;
        const pp = { x: 0, y: gy + 1.4, z: 141 }; // player 1 unit away → well inside reach (14)
        let melee = 0, fired = 0, voice = 0;
        const ctx = { vfx: g.vfx, audio: { playBuf: (n) => { if (n === "meeseeks_voice") voice++; }, creature: () => { melee = -999; } },
          onPlayerHit: () => { melee++; }, enemyFire: () => { fired++; }, airborne: false };
        for (let i = 0; i < 240; i++) mz.update(1 / 60, pp, ctx); // 4s → several attack cooldowns
        out.meeseeksFired = fired; out.meeseeksMeleeHits = melee;
        // force a death and see what audio plays (run many times to sample the 40% voice chance)
        for (let k = 0; k < 40; k++) { const m2 = g.combat.spawnEnemy({ kind: "meeseeks", weapon: "gun", x: 5, z: 140 }); if (m2) { m2._ctx = ctx; m2.hp = 1; m2.takeDamage(999); } }
        out.deathVoiceSamples = voice; out.deathGrowlUsed = melee < 0; // creature() would set melee to -999
      }
    }
    return out;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const rick = await probe(page, "http://localhost:5180/?level=meeseeks_mayhem");
  const mil = await probe(page, "http://localhost:5180/?level=desert-base"); // a military level
  console.log("RICK:", JSON.stringify(rick));
  console.log("MILITARY:", JSON.stringify(mil));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
