const { chromium } = require("playwright");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
(async () => {
  const browser = await chromium.launch({ headless: true, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 500, height: 500 } });
  await page.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.__game && window.__game.playerModel, null, { timeout: 90000 });
  const res = await page.evaluate(() => {
    const g = window.__game; const pm = g.playerModel;
    g._introDone = true; g._disposeLobby && g._disposeLobby(); g._startPlay(); g.controller.onUnlock = () => {};
    pm.setWeapon("rifle");
    const eff = (o) => { let p = o; while (p) { if (p.visible === false) return false; p = p.parent; } return true; }; const gunVisible = () => { let v = false; pm.group.traverse((o) => { if (o.isMesh && o.name && /blaster|magazine|gun|launcher/i.test(o.name) && eff(o)) v = true; }); return v; };
    const settle = (moving, speed, thrust, firing) => { for (let i = 0; i < 90; i++) { if (firing) pm.fireKick(); pm.update(1 / 60, moving, speed, thrust, 0); } const w = pm._weights(); w.gunVisible = gunVisible(); return w; };
    return {
      standShoot:   settle(false, 1, 0, true),    // grounded firing → gun aim, gun visible
      walkShoot:    settle(true, 1, 0, true),      // run-and-gun: legs walk + arms aim
      airHoverIdle: settle(false, 1, 0.42, false), // gliding, not firing → hover idle, gun stowed
      airShoot:     settle(false, 1, 0.42, true),  // FIRING while gliding → gun aim (NOT hover), gun visible
      fullJet:      settle(false, 1, 1, false),    // full thrust rise, not firing → hover idle, gun stowed
    };
  });
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
