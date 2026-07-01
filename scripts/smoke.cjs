const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  const booted = await page.waitForFunction(() => window.__game && window.__game.combat && window.__game.playerModel, { timeout: 60000 }).then(() => true).catch(() => false);
  const res = await page.evaluate(() => {
    const g = window.__game; const R = {};
    R.booted = !!(g.combat && g.playerModel);
    R.webgl = !!(g.engine && g.engine.renderer);
    g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
    R.energyBeam = !!g.weapon._energyBeam;
    R.rifleDamage = g.weapon.damage;                 // expect 68 (2x of 34)
    R.owned = g.weapon.owned.slice();
    R.noBannedWeapons = !g.weapon.owned.some((w) => ["smg", "laser", "railgun", "flak"].includes(w));
    R.muzzleOverride = !!g.weapon._muzzleOverride;
    const m = g.playerModel.getMuzzle && g.playerModel.getMuzzle();
    R.shotFromGun = !!(m && Math.hypot(m.x - g.camera.position.x, m.z - g.camera.position.z) > 0.4);
    R.rickAnimated = !!(g.playerModel && g.playerModel.update);
    // damage test: meeseeks dead-ahead, aim, fire rifle
    g.combat.enemies.length = 0;
    const gy = g.level.terrainHeight(0, 140);
    const mz = g.combat.spawnEnemy({ kind: "meeseeks", weapon: "gun", x: 0, z: 140 }); mz.aggro = true;
    const pp = { x: 0, y: gy + 1.4, z: 150 };
    for (let i = 0; i < 5; i++) mz.update(1 / 60, pp, { vfx: g.vfx, audio: g.audio, onPlayerHit: () => {}, enemyFire: () => {}, airborne: false });
    g.controller.pos.set(0, 0, 150); g.camera.position.set(0, gy + 1.4, 150); g.controller._euler.set(0, 0, 0); g.camera.quaternion.setFromEuler(g.controller._euler); g.scene.updateMatrixWorld(true);
    const hp0 = mz.hp; g.weapon.mode = "rifle"; g.weapon.A.rifle.mag = 30; g.combat.tryShoot(2000);
    R.meeseeksHP = hp0; R.dmgPerRifleShot = +(hp0 - mz.hp).toFixed(1);
    R.meeseeksBaseHP = hp0;
    return R;
  }).catch((e) => ({ evalErr: e.message }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: "media/smoke.jpg", type: "jpeg", quality: 88 });
  console.log("BOOTED:", booted);
  console.log("RESULT:", JSON.stringify(res));
  console.log("CONSOLE ERRORS:", errors.slice(0, 6));
  await browser.close();
})().catch((e) => { console.error("SMOKE ERR", e.message); process.exit(1); });
