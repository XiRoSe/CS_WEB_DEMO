const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 700, height: 800 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level.terrainHeight, null, { timeout: 90000 });
  const info = await page.evaluate(() => {
    const g = window.__game; const pm = g.playerModel;
    // use menu pose to frame + light, then override to a WALKING pose (tests our Mixamo walk clip on this mesh)
    let t = 0; for (let i = 0; i < 20; i++) { t += 1 / 60; g._rickMenuPose(1 / 60, t); }
    pm.setDancing(false);
    for (let i = 0; i < 60; i++) pm.update(1 / 60, true, 1, false, 0); // walking
    g.scene.updateMatrixWorld(true);
    // FK sanity: are feet below the head? (contorted clip → feet not below head)
    const wp = (name) => { let b = null; pm.group.traverse((o) => { if (o.isBone && o.name === name) b = o; }); return b ? b.getWorldPosition(g.camera.position.clone()).y : null; };
    const head = wp("head"), footL = wp("foot_l"), hand = wp("hand_r"), pelvis = wp("pelvis");
    document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
    if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    return { head: head && +head.toFixed(2), pelvis: pelvis && +pelvis.toFixed(2), footL: footL && +footL.toFixed(2), hand: hand && +hand.toFixed(2), uprightOK: (head != null && footL != null) ? head > pelvis && pelvis > footL : null };
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "media/meshtest.jpg", type: "jpeg", quality: 92 });
  console.log(JSON.stringify(info));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
