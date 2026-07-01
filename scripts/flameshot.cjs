const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 500, height: 800 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level.terrainHeight, null, { timeout: 90000 });
  for (const [thrust, name] of [[1, "full"], [0.42, "glide"]]) {
    await page.evaluate((thr) => {
      const g = window.__game; const pm = g.playerModel;
      g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
      const sp = g.level.playerSpawn, gy = g.level.terrainHeight(sp.x, sp.z) + 6;
      pm.group.position.set(sp.x, gy, sp.z); pm.group.rotation.y = Math.PI * 0.85;
      for (let i = 0; i < 60; i++) pm.update(1 / 60, false, 1, thr, 0); // airborne, palm thrust = thr
      g.camera.position.set(sp.x + 3.2, gy + 0.6, sp.z + 3.2); g.camera.lookAt(sp.x, gy - 0.5, sp.z);
      g.camera.fov = 46; g.camera.updateProjectionMatrix(); g.scene.updateMatrixWorld(true);
      document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
      if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    }, thrust);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `media/flames-${name}.jpg`, type: "jpeg", quality: 90 });
    console.log("shot", name);
  }
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
