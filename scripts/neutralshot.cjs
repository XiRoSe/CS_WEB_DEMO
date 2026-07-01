const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 700, height: 800 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level.terrainHeight, null, { timeout: 90000 });
  const info = await page.evaluate(() => {
    const g = window.__game; const pm = g.playerModel;
    // stay on start screen; use the menu pose to frame Rick + camera (it works), then stop dancing for an idle pose
    let t = 0; for (let i = 0; i < 20; i++) { t += 1 / 60; g._rickMenuPose(1 / 60, t); }
    pm.setDancing(false); pm.setWeapon("rifle"); pm.group.rotation.y = 0.4;
    for (let i = 0; i < 30; i++) pm.update(1 / 60, false, 1, false, 0);
    // UNLIT ALBEDO VIEW: make each Rick material emit its own base-color texture → lighting no longer matters
    const mats = [];
    pm.group.traverse((o) => { if (o.isMesh && o.material && o.material.map && o.name && /rick/i.test(o.name)) {
      const m = o.material; m.emissive.setRGB(1, 1, 1); m.emissiveMap = m.map; m.emissiveIntensity = 1; m.needsUpdate = true;
      mats.push(o.name);
    } });
    g.scene.updateMatrixWorld(true);
    document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
    if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    return { unlitMats: mats };
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "media/rick-neutral.jpg", type: "jpeg", quality: 92 });
  console.log(JSON.stringify(info));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
