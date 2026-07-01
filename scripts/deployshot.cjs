const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 700, height: 800 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel && window.__game.level && window.__game.level.terrainHeight, null, { timeout: 90000 });
  const diag = await page.evaluate(() => {
    const g = window.__game;
    // drive the start-screen pose a few frames so Rick is placed + lit like the deploy screen
    for (let i = 0; i < 30; i++) g._rickMenuPose(1 / 60, 2.0);
    g.scene.updateMatrixWorld(true);
    // sample the lights
    const lights = [];
    g.scene.traverse((o) => { if (o.isLight) lights.push({ type: o.type, intensity: +o.intensity.toFixed(2), color: "#" + o.color.getHexString(), pos: o.position && [o.position.x | 0, o.position.y | 0, o.position.z | 0] }); });
    // sample Rick's material(s)
    const mats = new Set(); let meshCount = 0;
    g.playerModel.group.traverse((o) => { if (o.isMesh && o.material) { meshCount++; const m = o.material; mats.add(JSON.stringify({ name: o.name || m.name, hasMap: !!m.map, mapCS: m.map && m.map.colorSpace, color: "#" + (m.color ? m.color.getHexString() : "?"), rough: m.roughness, metal: m.metalness, emissive: m.emissive ? "#" + m.emissive.getHexString() : null })); } });
    // where is the camera vs the sun (is Rick's front lit?)
    const dir = g.camera.position.clone(); g.camera.getWorldDirection(dir);
    return { renderer: { toneMapping: g.engine.renderer.toneMapping, exposure: g.engine.renderer.toneMappingExposure, outCS: g.engine.renderer.outputColorSpace }, lights: lights.slice(0, 8), meshCount, mats: [...mats].slice(0, 6), camDir: [dir.x.toFixed(2), dir.y.toFixed(2), dir.z.toFixed(2)] };
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "media/deploy-rick.jpg", type: "jpeg", quality: 90 });
  console.log(JSON.stringify(diag, null, 1));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
