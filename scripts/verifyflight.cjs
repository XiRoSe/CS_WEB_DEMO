const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.controller && window.__game.playerModel, null, { timeout: 90000 });
  const res = await page.evaluate(() => {
    const g = window.__game; const c = g.controller;
    g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
    const mkInput = (held, mouse) => ({ isDown: (...ks) => ks.some((k) => held.includes(k)), mouseDown: mouse, touch: null });
    const airborne = () => { c.onGround = false; c.swimming = false; c.feetY = 400; c.pos.set(g.level.playerSpawn.x, 0, g.level.playerSpawn.z); c.vy = -6; };
    const out = { walkSpeed: +c.walkSpeed.toFixed(2), sprintSpeed: +c.sprintSpeed.toFixed(2) };
    // 1) E held, NOT firing → full thrust
    airborne(); c.update(1 / 60, mkInput(["e"], false));
    out.eNoFire = { jetting: c.jetting, gliding: c.gliding, thrust: +c.thrust.toFixed(2), rising: c.vy > 0 };
    // 2) E held + FIRING → full thrust cut, glide slow-fall + small flames
    airborne(); c.update(1 / 60, mkInput(["e"], true));
    out.eFiring = { jetting: c.jetting, gliding: c.gliding, thrust: +c.thrust.toFixed(2), vyCapped: c.vy >= -3.5 };
    // 3) FIRING only (no E), airborne falling → still glides (small flames, slow fall)
    airborne(); c.update(1 / 60, mkInput([], true));
    out.fireOnly = { jetting: c.jetting, gliding: c.gliding, thrust: +c.thrust.toFixed(2), vyCapped: c.vy >= -3.5 };
    // 4) nothing → normal fast fall, no flames
    airborne(); c.vy = -10; c.update(1 / 60, mkInput([], false));
    out.freefall = { jetting: c.jetting, gliding: c.gliding, thrust: +c.thrust.toFixed(2), fastFall: c.vy < -5 };
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
