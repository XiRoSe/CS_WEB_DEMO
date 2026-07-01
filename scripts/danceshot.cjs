const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 700, height: 800 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level.terrainHeight, null, { timeout: 90000 });
  const diag = await page.evaluate(() => {
    const g = window.__game; const pm = g.playerModel;
    // stay on the start screen; drive the menu pose (which now dances)
    let t = 0; for (let i = 0; i < 120; i++) { t += 1 / 60; g._rickMenuPose(1 / 60, t); }
    g.scene.updateMatrixWorld(true);
    // sample a hand bone world position, step a few frames, sample again → confirms the dance is actually moving
    const handName = "hand_r";
    let bone = null; pm.group.traverse((o) => { if (o.isBone && o.name === handName) bone = o; });
    const p1 = bone ? bone.getWorldPosition(g.camera.position.clone()).toArray().map((x) => +x.toFixed(3)) : null;
    for (let i = 0; i < 20; i++) { t += 1 / 60; g._rickMenuPose(1 / 60, t); }
    g.scene.updateMatrixWorld(true);
    const p2 = bone ? bone.getWorldPosition(g.camera.position.clone()).toArray().map((x) => +x.toFixed(3)) : null;
    const moved = p1 && p2 ? +Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]).toFixed(3) : null;
    // gun visible?
    let gunVisible = null; pm.group.traverse((o) => { if (o.name && /blaster|magazine|launcher|gun/i.test(o.name)) { gunVisible = gunVisible || o.visible; } });
    const w = pm._weights ? pm._weights() : {};
    document.querySelectorAll("#ui > *").forEach((e) => e.style && (e.style.display = "none"));
    if (g.engine.renderer) { g.engine.renderer.render(g.scene, g.camera); g.engine.outline && g.engine.outline.render(g.scene, g.camera); }
    return { danceHandMovedOver20frames: moved, gunVisible, weights: w };
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "media/dance-deploy.jpg", type: "jpeg", quality: 90 });
  console.log(JSON.stringify(diag));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
