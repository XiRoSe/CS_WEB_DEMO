// Fix rick.glb's garbled textures. The FBX round-trip through Mixamo desynced the mesh's UVs from its positions
// (vertex reorder), so limbs/coat sample the black atlas background. The UE4 original (same mesh, correct UVs) is
// vertex-identical in shape once normalized. So: for each rick.glb vertex, find its twin in the UE4 original by
// position and copy that vertex's correct UV. Skeleton/skin/animations stay untouched — only TEXCOORD_0 is rebuilt.
const { NodeIO } = require("@gltf-transform/core");
const RICK = "public/models/rick.glb";
const UE4 = "C:/Users/aniha/Downloads/rick_sanchez_-_ready_for_ue4_rigged.glb";
const prim = (doc, matName) => { for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) if (p.getMaterial().getName() === matName) return p; };
function normed(pos) { // center + scale to unit bbox -> pose/shape-invariant key space (both meshes share shape)
  let mn = [9e9, 9e9, 9e9], mx = [-9e9, -9e9, -9e9];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { if (pos[i + k] < mn[k]) mn[k] = pos[i + k]; if (pos[i + k] > mx[k]) mx[k] = pos[i + k]; }
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], s = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
  const o = new Float32Array(pos.length); for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) o[i + k] = (pos[i + k] - c[k]) / s;
  return o;
}
(async () => {
  const io = new NodeIO();
  const A = await io.read(RICK), B = await io.read(UE4);
  for (const mat of ["M_RickSanchez", "M_RickSanchez_Coat"]) {
    const pa = prim(A, mat), pb = prim(B, mat);
    const na = normed(pa.getAttribute("POSITION").getArray()), nb = normed(pb.getAttribute("POSITION").getArray());
    const uvB = pb.getAttribute("TEXCOORD_0").getArray();
    const NA = na.length / 3, NB = nb.length / 3;
    // spatial hash of UE4 verts (quantized normalized pos -> vertex index) for O(1) lookup
    const Q = 1e4, key = (x, y, z) => (Math.round(x * Q)) + "_" + (Math.round(y * Q)) + "_" + (Math.round(z * Q));
    const grid = new Map();
    for (let j = 0; j < NB; j++) { const k = key(nb[j * 3], nb[j * 3 + 1], nb[j * 3 + 2]); if (!grid.has(k)) grid.set(k, j); }
    const newUV = new Float32Array(NA * 2);
    let hashHits = 0, brute = 0, maxd = 0;
    for (let i = 0; i < NA; i++) {
      const x = na[i * 3], y = na[i * 3 + 1], z = na[i * 3 + 2];
      let j = grid.get(key(x, y, z));
      if (j === undefined) { // nearest-neighbor fallback (rare rounding edge)
        let best = 9e9, bj = 0;
        for (let q = 0; q < NB; q++) { const dx = x - nb[q * 3], dy = y - nb[q * 3 + 1], dz = z - nb[q * 3 + 2]; const d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bj = q; } }
        j = bj; brute++; if (Math.sqrt(best) > maxd) maxd = Math.sqrt(best);
      } else hashHits++;
      newUV[i * 2] = uvB[j * 2]; newUV[i * 2 + 1] = uvB[j * 2 + 1];
    }
    pa.getAttribute("TEXCOORD_0").setArray(newUV);
    console.log(mat, "| verts", NA, "| hashHits", hashHits, "| bruteFallback", brute, "| worstFallbackDist", maxd.toFixed(5));
  }
  await io.write(RICK, A);
  console.log("wrote corrected", RICK);
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
