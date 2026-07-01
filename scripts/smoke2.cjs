const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.combat && window.__game.playerModel, null, { timeout: 90000 });
  const info = await page.evaluate(() => {
    const g = window.__game; g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
    g.combat.enemies.length = 0;
    const gy = g.level.terrainHeight(0, 150); g.controller.pos.set(0, 4, 150); g.controller.feetY = gy + 4; // airborne
    // simulate flying: jetting on, run the player model a bunch of frames so the hand plume builds
    let particles = 0;
    for (let i = 0; i < 40; i++) g.playerModel.update(1 / 60, false, 1, true, 0); // jetting=true
    g.playerModel.group.traverse((o) => { if (o.isPoints) particles = o.geometry.attributes.position.count; });
    // frame Rick from the front-side so we see the palms
    g.playerModel.group.position.set(0, gy + 4, 150); g.playerModel.group.rotation.y = Math.PI * 0.75;
    g.camera.position.set(2.6, gy + 4.6, 152.6); g.camera.lookAt(0, gy + 3.8, 150); g.camera.fov = 42; g.camera.updateProjectionMatrix(); g.camera.updateMatrixWorld(true);
    document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
    if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    // is the gun hidden while flying?
    let gunVisible = null; // find the held gun group
    return JSON.stringify({ thrusterParticles: particles, jetting: true });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "media/handjets.jpg", type: "jpeg", quality: 90 });
  console.log("JET:", info);
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
