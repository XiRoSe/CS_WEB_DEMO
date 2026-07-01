const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 800, height: 800 } });
  await p.goto("http://localhost:5180/?level=meeseeks_mayhem", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForFunction(() => window.__game && window.__game.combat && window.__game.playerModel, null, { timeout: 90000 });
  await p.evaluate(() => {
    const g = window.__game; g._introDone=true; g._disposeLobby&&g._disposeLobby(); g._startPlay(); g.controller.onUnlock=()=>{};
    g.combat.enemies.length=0;
    const gy=g.level.terrainHeight(0,150); const pm=g.playerModel; pm.setWeapon("rifle");
    for (let i=0;i<80;i++) pm.update(1/60, false, 1, false, 0); // idle → gun lowers
    pm.group.position.set(0,gy,150); pm.group.rotation.y=Math.PI*0.72;
    g.camera.position.set(2.4,gy+1.5,152.4); g.camera.lookAt(0,gy+1.0,150); g.camera.fov=42; g.camera.updateProjectionMatrix(); g.camera.updateMatrixWorld(true);
    document.querySelectorAll("#ui > *").forEach(e=>e.style&&(e.style.display="none"));
    if(g.engine.renderer){g.engine.renderer.render(g.scene,g.camera);g.engine.outline&&g.engine.outline.render(g.scene,g.camera);}
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path:"media/idle-gundown.jpg", type:"jpeg", quality:90 });
  await b.close();
})().catch(e => { console.error("ERR", e.message); process.exit(1); });
