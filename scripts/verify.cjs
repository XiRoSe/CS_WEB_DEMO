const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 900, height: 900 } });
  await p.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForFunction(() => window.__game && window.__game.combat && window.__game.playerModel, null, { timeout: 90000 });
  const R = await p.evaluate(() => {
    const g = window.__game; const o = {};
    g._introDone=true; g._disposeLobby&&g._disposeLobby(); g._startPlay(); g.controller.onUnlock=()=>{};
    // huge meeseeks
    g.combat.enemies.length=0;
    const huge = g.combat.spawnEnemy({kind:"meeseeks",huge:true,weapon:"gun",x:0,z:120});
    o.hugeScale = huge.sc; o.hugeMelee = huge.melee;
    const pm = g.playerModel;
    pm.setWeapon("rifle");
    // 1) idle → gun should lower (gunRotX ~ +1.1)
    for (let i=0;i<70;i++) pm.update(1/60, false, 1, false, 0);
    o.idle = pm._weights();
    // 2) walking (no fire) → walk weight high, gun back up (rotX ~0)
    for (let i=0;i<40;i++) pm.update(1/60, true, 1, false, 0);
    o.walking = pm._weights();
    // 3) firing WHILE MOVING → walk should stay high, gunplay ~0 (run-and-gun)
    for (let i=0;i<30;i++) { pm.fireKick(); pm.update(1/60, true, 1, false, 0); }
    o.moveShoot = pm._weights();
    // 4) firing while STANDING → gunplay pose should engage
    for (let i=0;i<30;i++) { pm.fireKick(); pm.update(1/60, false, 1, false, 0); }
    o.standShoot = pm._weights();
    return o;
  });
  console.log(JSON.stringify(R, null, 0));
  await b.close();
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
