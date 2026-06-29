import * as THREE from "three";

// Experimental in-engine rigging for STATIC merged meshes (no skeleton). Approach #1: RIGID PART-SPLIT.
// We slice the mesh's triangles into body regions by spatial position and reparent each region under a
// joint pivot, so rotating a pivot swings that limb. No skin weights — rigid parts (low-poly puppet rig).
//
// rigHumanoid(group, opts) operates on a model instance (group with the scaled mesh inside, feet ≈ y=0).
// Returns { legL, legR, armL, armR } pivot groups to animate (null if a region had no geometry).
// opts.debug tints each extracted region so you can verify the split visually.
export function rigHumanoid(group, opts = {}) {
  group.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(group); const size = new THREE.Vector3(); box.getSize(size);
  const minY = box.min.y, H = size.y, W = size.x, cx = (box.min.x + box.max.x) / 2;
  const hipY = minY + H * (opts.hip ?? 0.46);          // legs: below this
  const shoulderY = minY + H * (opts.shoulder ?? 0.80); // arms: above this and out to the sides
  const armX = W * (opts.armX ?? 0.16);                 // |x-cx| beyond this (in the upper body) = an arm

  // joint pivots (in group-local space)
  const mk = (x, y) => { const g = new THREE.Group(); g.position.set(x, y, 0); group.add(g); return g; };
  const legL = mk(cx - W * 0.13, hipY), legR = mk(cx + W * 0.13, hipY);
  const armL = mk(cx - W * 0.26, shoulderY), armR = mk(cx + W * 0.26, shoulderY);
  const region = { legL, legR, armL, armR };

  const classify = (x, y) => {
    if (y < hipY) return x < cx ? "legL" : "legR";
    if (y > shoulderY && Math.abs(x - cx) > armX) return x < cx ? "armL" : "armR";
    return null; // torso/head/pelvis → stays in the body
  };

  const sources = []; group.traverse((o) => { if (o.isMesh) sources.push(o); });
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const dbgCol = { legL: 0xff5555, legR: 0x55ff55, armL: 0x5599ff, armR: 0xffbb33 };

  for (const mesh of sources) {
    mesh.updateWorldMatrix(true, false);
    const toGroup = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld); // mesh-local → group-local
    const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
    const pos = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv;
    const triN = pos.count / 3;
    const buckets = { legL: [], legR: [], armL: [], armR: [], keep: [] }; // arrays of triangle indices
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), ct = new THREE.Vector3();
    for (let t = 0; t < triN; t++) {
      va.fromBufferAttribute(pos, t * 3).applyMatrix4(toGroup);
      vb.fromBufferAttribute(pos, t * 3 + 1).applyMatrix4(toGroup);
      vc.fromBufferAttribute(pos, t * 3 + 2).applyMatrix4(toGroup);
      ct.copy(va).add(vb).add(vc).multiplyScalar(1 / 3);
      const r = classify(ct.x, ct.y);
      buckets[r || "keep"].push(t);
    }
    // build a sub-mesh (in group space) for each region bucket + put it under that region's pivot
    for (const key of ["legL", "legR", "armL", "armR"]) {
      const tris = buckets[key]; if (!tris.length) continue;
      const sub = subGeometry(geo, tris, toGroup);
      let mat = mesh.material; if (opts.debug) { mat = mesh.material.clone(); mat.color = new THREE.Color(dbgCol[key]); }
      const m = new THREE.Mesh(sub, mat); m.castShadow = true; m.frustumCulled = false;
      const pivot = region[key]; m.position.set(-pivot.position.x, -pivot.position.y, -pivot.position.z); // cancel pivot offset → render in place
      pivot.add(m);
    }
    // rebuild the original mesh from the "keep" triangles only (so limbs aren't duplicated)
    if (buckets.keep.length && buckets.keep.length < triN) {
      mesh.geometry = subGeometry(geo, buckets.keep, null); // keep mesh-local (mesh keeps its own transform)
    } else if (!buckets.keep.length) {
      mesh.visible = false; // whole mesh became limbs
    }
  }
  // drop pivots that captured nothing
  for (const k of Object.keys(region)) if (!region[k].children.length) { group.remove(region[k]); region[k] = null; }
  return region;
}

// build a BufferGeometry from a subset of triangles of `geo`; if `xform` given, bake it into positions/normals
function subGeometry(geo, tris, xform) {
  const src = geo.attributes; const out = { position: [], normal: src.normal ? [] : null, uv: src.uv ? [] : null };
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const nMat = xform ? new THREE.Matrix3().getNormalMatrix(xform) : null;
  for (const t of tris) for (let k = 0; k < 3; k++) {
    const i = t * 3 + k;
    v.fromBufferAttribute(src.position, i); if (xform) v.applyMatrix4(xform);
    out.position.push(v.x, v.y, v.z);
    if (out.normal) { n.fromBufferAttribute(src.normal, i); if (nMat) n.applyMatrix3(nMat).normalize(); out.normal.push(n.x, n.y, n.z); }
    if (out.uv) out.uv.push(src.uv.getX(i), src.uv.getY(i));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.position, 3));
  if (out.normal) g.setAttribute("normal", new THREE.Float32BufferAttribute(out.normal, 3));
  if (out.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(out.uv, 2));
  if (!out.normal) g.computeVertexNormals();
  return g;
}
