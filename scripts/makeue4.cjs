// The original UE4-rigged Rick has correct textures+UVs (it's the source the broken transfer came from). Its GLTF
// export suffixed every bone with _NN (pelvis_03, spine_01_04...). Strip the trailing _NN so our clips bind by the
// clean UE4 names (pelvis, spine_01, hand_r...). Output rick_ue4.glb.
const { NodeIO } = require("@gltf-transform/core");
const SRC = "C:/Users/aniha/Downloads/rick_sanchez_-_ready_for_ue4_rigged.glb";
const OUT = "public/models/rick_ue4.glb";
(async () => {
  const io = new NodeIO();
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  let renamed = 0;
  for (const node of root.listNodes()) {
    const n = node.getName();
    const clean = n.replace(/_\d+$/, "");           // pelvis_03 -> pelvis, spine_01_04 -> spine_01
    if (clean !== n && clean.length) { node.setName(clean); renamed++; }
  }
  await io.write(OUT, doc);
  const joints = root.listSkins()[0] ? root.listSkins()[0].listJoints().map((j) => j.getName()) : [];
  console.log("renamed", renamed, "nodes ->", OUT);
  console.log("hasPelvis:", joints.includes("pelvis"), "hasHandR:", joints.includes("hand_r"), "hasSpine01:", joints.includes("spine_01"), "hasThighL:", joints.includes("thigh_l"));
  console.log("sample:", joints.slice(0, 12).join(","));
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
