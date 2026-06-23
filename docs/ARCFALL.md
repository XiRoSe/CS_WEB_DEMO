# ARCFALL — build plan

A daytime island survival shooter on the NightOps engine/kit: **parachute in, recover the 12 lost
arcs, survive monsters + giant robots.** Everything is built respecting the three tiers — generic
bits in `engine/`, reusable toolkit in `kit/`, game content in `game/`.

## Done
- [x] **Day mode** (`engine/engine.js`: `setupDay` + `addDayLights`) — blue sky, clouds, sun, bright IBL.
- [x] **`collect` objective** (`game/objectives/collect.js`) — recover N arcs → win, behind the objective interface.
- [x] **Arc relics + gift crates** (`kit/level-builder.js`) — glowing collectibles (emissive + sky beam, no per-arc lights) and loot crates.
- [x] **Animated creature enemies** (`game/actors/{monster,robot}.js` + `creature-assets.js`) — Quaternius CC0
      Velociraptor / Spider (charge+bite), T-Rex mini-boss, giant Mech (ranged), via `AnimationMixer`.
- [x] **ARCFALL branding** + `?level=arcfall`.
- [x] First-person parachute placeholder (`game/parachute-intro.js`).

## To add (in order)

### 1. Sculpted island — terrain, sea, sky  *(engine + kit)*
- [ ] **engine/controller.js** — terrain-follow: `_groundUnder` also samples `level.terrainHeight(x,z)` so the
      player walks up/down hills (flat levels pass no terrain → unchanged).
- [ ] **kit/level-builder.js** — `islandTerrain(opts)`: a displaced, vertex-colored heightfield mesh (grass
      up high → sandy **beach** at the shoreline), expose `this.terrainHeight(x,z)` (same function used for
      the mesh) so props + actors seat on it. Big animated-ish **sea** plane around it; distant **mountains**.
- [ ] **actors** (`monster`, `robot`, raiders) + placed props (arc, gift, tree, structures) — seat on terrain
      via `terrainHeight` (already wired in the creature actors; add to raiders + builder placements).
- [ ] **engine** — richer sky: layered clouds / horizon haze, brighter sun, depth fog tuned for the island.

### 1b. Shallow wadeable lakes + climbable structures  *(kit)*
- [x] `lake()` carves a smooth bowl + a wadeable water disc just below ground level.
- [ ] Climbable **buildings / ruins / towers** the player can get on top of (stepped/ramped colliders,
      terrain-seated via `baseY`), some hiding **weapon pickups** to reward exploration.

### 2. Replace nature assets — lusher world  *(kit)*
- [ ] **kit/content/nature.js** — `PropAsset` loaders for the Quaternius **palm / birch tree / rocks** (already
      downloaded to `public/models/nature/`).
- [ ] **kit/level-builder.js** — `tree()` / `scatterTrees()` use the GLB models; add `rock()` / `scatterRocks()`.
      Vibrant, Fortnite-bright palette.

### 3. Cinematic parachute start  *(game)*
- [ ] Rewrite `parachute-intro.js` as a **third-person** cinematic: the operator hangs under a big colorful
      canopy high in the sky, descends with sway while the camera orbits, the canopy collapses on landing,
      then it cuts to first-person. (Models the existing `Intro` heli cinematic.)

### 4. Sci-fi weapons — big booms + blasts  *(kit + engine)*
- [ ] **kit/weapon.js** — add viewmodels + modes (cycle with Q or 1/2/3): a **Plasma Cannon** (charged
      energy bolt → large blast), an **Arc/Lightning gun** (chaining beam), and a **BFG-style** heavy
      orb (huge AoE). Reuse `engine/projectiles.js` (`Projectile` + `applyBlast`) and `engine/vfx.js`.
- [ ] **engine/vfx.js** — new effects: energy bolt trail, plasma flash, chain-lightning arcs, a bigger
      shockwave for the heavy blast. Tune via `config.balance` (per-weapon radius/damage/units).
- [ ] **kit/content/weapons.js** — source CC0 sci-fi gun GLBs if good ones exist; else stylized procedural.

### 5. Audio  *(engine + game)*
- [ ] Island **ambience** (wind/birds), creature **roars/hiss/steps** (raptor, spider, T-Rex), mech
      **servo/stomp**, sci-fi **weapon fire + charge** sounds, an **arc-collected** chime, gift pickup.
      Source CC0 or synthesize via `engine/audio.js`; trigger from the actors/objective/weapon.

### 6. Polish pass  *(all)*
- [ ] Color grading / vibrant materials, ambient island SFX, an arc-collected fanfare, a robot-boss
      death sequence, HUD theming for ARCFALL.

## Notes
- Keep the boundary: `engine/` stays generic (day mode, terrain-follow, vfx), `kit/` holds the island
  toolkit + weapons + content, `game/` holds ARCFALL's level/objective/actors. `npm run lint` enforces it.
- Verify each step: `npm run build` green, 0 console errors, the standing checks (`window.__game`).
