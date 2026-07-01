const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 560, height: 680 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level.terrainHeight, null, { timeout: 90000 });
  for (const [tag, yaw] of [["y0", 0], ["yPI", Math.PI]]) {
    await page.evaluate((y) => {
      const g = window.__game; const pm = g.playerModel;
      // use the deploy-screen framing (known to show Rick clearly), then override to a shooting pose
      let t = 0; for (let i = 0; i < 10; i++) { t += 1 / 60; g._rickMenuPose(1 / 60, t); }
      pm.setDancing(false); pm.setWeapon("rifle"); pm.group.rotation.y = y;
      for (let i = 0; i < 90; i++) { pm.fireKick(); pm.update(1 / 60, false, 1, 0, 0); }
      g.scene.updateMatrixWorld(true);
      document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
      if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    }, yaw);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `media/shoot-${tag}.jpg`, type: "jpeg", quality: 90 });
    console.log("shot", tag);
  }
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
