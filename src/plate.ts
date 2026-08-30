/**
 * B2 plates + B6 exhibition finishing, spec millimetre space.
 * Axes copied out of CORE_SPEC.json — do not import vendor source.
 */
import * as THREE from "three";

/** CORE_SPEC.partAxesMm XY (Z is arbor mid-plane, unused for hole centres). */
const AXES: Record<string, { x: number; y: number }> = {
  barrel: { x: -6.045072939534456, y: -2.818863805810464 },
  center: { x: 0, y: 0 },
  third: { x: 4.549778035879225, y: 2.843016852611144 },
  fourth: { x: 0.14362218235134794, y: 5.054507434644454 },
  escape: { x: -4.035822753424774, y: 3.2121458309370468 },
};

/** Bridge jewels: center + third + fourth (compact 6-o'clock cluster after 180°). */
export const BRIDGE_ARBORS = ["center", "third", "fourth"] as const;

export const PART_AXES_MM = AXES;

/** ~32 mm class — train AABB is ~28 mm. */
const PLATE_R = 16;
const BORE_R = 0.88;
const JEWEL_R = 0.62;
const CHATON_INNER = 0.66;
const CHATON_OUTER = 1.06;
const BRIDGE_ISLAND_R = 2.86;
const BRIDGE_SIDE_BULGE = 0.18;

/**
 * Exhibition: bridge + train face −Z. Dial stays +Z.
 * Train GLB ≈ −0.76 … 2.75 mm. Plate under the dial; bridge below the train.
 * No barrel window — plate underside sits 0.13 mm above train max; skip if unsure.
 */
const PLATE_BOTTOM = 2.88;
const PLATE_THICK = 0.58;
const BRIDGE_TOP = -0.92;
const BRIDGE_THICK = 0.52;
const BRIDGE_BOTTOM = BRIDGE_TOP - BRIDGE_THICK;

function brushMap() {
  const n = 256;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 110; i++) {
    const y = (i / 110) * n;
    ctx.strokeStyle = `rgba(255,255,255,${0.05 + (i % 4) * 0.03})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(n, y + ((i % 3) - 1) * 0.6);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.16, 0.16);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

const plateMat = () => {
  const grain = brushMap();
  return new THREE.MeshPhysicalMaterial({
    color: 0xb3b0a7,
    metalness: 0.86,
    roughness: 0.4,
    roughnessMap: grain ?? undefined,
    anisotropy: 0.32,
    anisotropyRotation: 0.15,
  });
};

const polishSteel = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0xc6c3bb,
    metalness: 0.9,
    roughness: 0.2,
  });

const jewelMat = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0x7a142c,
    metalness: 0.05,
    roughness: 0.08,
    transparent: true,
    opacity: 0.88,
  });

function boreHoles(shape: THREE.Shape, centers: { x: number; y: number }[]) {
  for (const c of centers) {
    const hole = new THREE.Path();
    hole.absarc(c.x, c.y, BORE_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
}

function discWithBores(radius: number, centers: { x: number; y: number }[]) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  boreHoles(shape, centers);
  return shape;
}

function annulus(inner: number, outer: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

/** Rounded three-island outline; sides bow slightly so it reads less like a hull. */
function bridgeOutline(centers: { x: number; y: number }[], island: number) {
  const pts = centers.map((c) => new THREE.Vector2(c.x, c.y));
  const o = new THREE.Vector2();
  pts.forEach((p) => o.add(p));
  o.multiplyScalar(1 / pts.length);
  pts.sort(
    (a, b) =>
      Math.atan2(a.y - o.y, a.x - o.x) - Math.atan2(b.y - o.y, b.x - o.x),
  );

  const n = pts.length;
  const shape = new THREE.Shape();
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len;
    const ny = -dx / len;
    const sx = curr.x + nx * island;
    const sy = curr.y + ny * island;
    const ex = next.x + nx * island;
    const ey = next.y + ny * island;
    if (i === 0) shape.moveTo(sx, sy);
    else {
      const prev = pts[(i + n - 1) % n];
      const pdx = curr.x - prev.x;
      const pdy = curr.y - prev.y;
      const plen = Math.hypot(pdx, pdy) || 1;
      shape.absarc(
        curr.x,
        curr.y,
        island,
        Math.atan2(-pdx / plen, pdy / plen),
        Math.atan2(ny, nx),
        false,
      );
    }
    shape.quadraticCurveTo(
      (sx + ex) / 2 + nx * BRIDGE_SIDE_BULGE,
      (sy + ey) / 2 + ny * BRIDGE_SIDE_BULGE,
      ex,
      ey,
    );
  }
  const first = pts[0];
  const last = pts[n - 1];
  const pdx = first.x - last.x;
  const pdy = first.y - last.y;
  const plen = Math.hypot(pdx, pdy) || 1;
  const next = pts[1];
  const dx = next.x - first.x;
  const dy = next.y - first.y;
  const len = Math.hypot(dx, dy) || 1;
  shape.absarc(
    first.x,
    first.y,
    island,
    Math.atan2(-pdx / plen, pdy / plen),
    Math.atan2(-dx / len, dy / len),
    false,
  );
  boreHoles(shape, centers);
  return shape;
}

function extrude(
  shape: THREE.Shape,
  thick: number,
  zBottom: number,
  bevel: number,
  material: THREE.Material,
  curveSegments = 40,
) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.05, thick - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments,
  });
  geom.translate(0, 0, zBottom);
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = false;
  return mesh;
}

function jewel(x: number, y: number, z0: number, z1: number, material: THREE.Material) {
  const h = z1 - z0;
  const geom = new THREE.CylinderGeometry(JEWEL_R, JEWEL_R, h, 20);
  geom.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(x, y, (z0 + z1) / 2);
  return mesh;
}

/** Conical steel sink; wide face toward −Z (exhibition). */
function steelSink(x: number, y: number, z: number, material: THREE.Material) {
  const geom = new THREE.CylinderGeometry(CHATON_INNER, CHATON_OUTER, 0.055, 24);
  geom.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  return mesh;
}

export function createPlates(): THREE.Group {
  const root = new THREE.Group();
  root.name = "plates";

  const steel = plateMat();
  const polish = polishSteel();
  const ruby = jewelMat();
  const all = Object.values(AXES);
  const bridgeCenters = BRIDGE_ARBORS.map((name) => AXES[name]);

  const plateCluster = new THREE.Group();
  plateCluster.name = "mainplate_cluster";
  const bridgeCluster = new THREE.Group();
  bridgeCluster.name = "bridge_cluster";

  const mainplate = extrude(discWithBores(PLATE_R, all), PLATE_THICK, PLATE_BOTTOM, 0.07, steel, 36);
  mainplate.name = "mainplate";
  plateCluster.add(mainplate);

  const rim = extrude(annulus(14.45, 15.72), 0.055, PLATE_BOTTOM - 0.035, 0.016, polish, 48);
  plateCluster.add(rim);

  const bridge = extrude(
    bridgeOutline(bridgeCenters, BRIDGE_ISLAND_R),
    BRIDGE_THICK,
    BRIDGE_BOTTOM,
    0.09,
    steel,
    48,
  );
  bridge.name = "train_bridge";
  bridgeCluster.add(bridge);

  const plateTop = PLATE_BOTTOM + PLATE_THICK;
  for (const c of all) {
    const isCenter = c.x === 0 && c.y === 0;
    if (isCenter) continue;
    plateCluster.add(jewel(c.x, c.y, plateTop - 0.12, plateTop + 0.18, ruby));
  }
  for (const c of bridgeCenters) {
    bridgeCluster.add(steelSink(c.x, c.y, BRIDGE_BOTTOM - 0.012, polish));
    bridgeCluster.add(jewel(c.x, c.y, BRIDGE_BOTTOM - 0.02, BRIDGE_TOP + 0.18, ruby));
  }

  root.add(plateCluster);
  root.add(bridgeCluster);
  root.scale.setScalar(0.001);
  return root;
}
