/**
 * Heat-blued leaf hands in spec millimetres.
 * Parent is a GLB arbor (already under root scale 0.001) — do not scale again.
 *
 * H cycles: fine (default, feuilles + crescent seconds) → leaf (infinity) → open.
 */
import * as THREE from "three";

const MM = 0.001;
const DIAL_SURFACE_MM = 3.52 + 0.28;
const WELL_FLOOR_MM = DIAL_SURFACE_MM - 0.42;

export const HAND_LANES = ["fine", "leaf", "open"] as const;
export type HandStyle = (typeof HAND_LANES)[number];

function blued(roughness = 0.12, color = 0x163e78) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.96,
    roughness,
    envMapIntensity: 0.58,
    clearcoat: 0.22,
    clearcoatRoughness: 0.22,
  });
}

function hub(radius: number, thick: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick + 0.02, 22), mat);
  disc.rotation.x = Math.PI / 2;
  const eye = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, thick + 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9c4bb, metalness: 0.88, roughness: 0.22, envMapIntensity: 0.4 }),
  );
  eye.rotation.x = Math.PI / 2;
  g.add(disc, eye);
  return g;
}

type Curve = { belly: number; waist: number; tip: number; root: number };

const CURVE_LEAF: Curve = { belly: 0.55, waist: 0.48, tip: 0.16, root: 0.82 };
const CURVE_FINE: Curve = { belly: 0.34, waist: 0.24, tip: 0.08, root: 0.62 };

function leafShape(length: number, width: number, curve: Curve) {
  const shape = new THREE.Shape();
  const rootW = Math.max(width * 0.12, 0.07);
  shape.moveTo(rootW, curve.root);
  shape.bezierCurveTo(width * curve.belly, length * 0.28, width * curve.waist, length * 0.58, curve.tip, length);
  shape.lineTo(-curve.tip, length);
  shape.bezierCurveTo(-width * curve.waist, length * 0.58, -width * curve.belly, length * 0.28, -rootW, curve.root);
  shape.closePath();
  return shape;
}

function punchAlmonds(shape: THREE.Shape, length: number) {
  for (const y of [length * 0.4, length * 0.63]) {
    const hole = new THREE.Path();
    hole.absarc(0, y, 0.2, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
}

/** Figure-8 then needle. Leaf lane only. */
function infinitySeconds(length: number, mat: THREE.Material) {
  const g = new THREE.Group();
  g.add(hub(0.16, 0.08, mat));
  const r = 0.07;
  const y0 = 0.22;
  const strandA: THREE.Vector3[] = [];
  const strandB: THREE.Vector3[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = y0 + t * (length - y0);
    if (t <= 0.5) {
      const u = t / 0.5;
      const envelope = 0.3 * Math.sin(u * Math.PI);
      const x = Math.sin(u * Math.PI * 2) * envelope;
      const z = 0.04 * Math.sin(u * Math.PI);
      strandA.push(new THREE.Vector3(x, y, z));
      strandB.push(new THREE.Vector3(-x, y, -z));
    } else {
      strandA.push(new THREE.Vector3(0, y, 0));
    }
  }
  g.add(
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandA, false, "centripetal"), 56, r, 8, false), mat),
  );
  g.add(
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandB, false, "centripetal"), 32, r, 8, false), mat),
  );
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, r * 2.1, 8), mat);
  tip.position.y = length + r * 0.55;
  g.add(tip);
  return g;
}

function crescentShape(outer: number, inner: number, shift: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(shift, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

/** Needle + crescent counterweight — the quiet luna mark. */
function crescentSeconds(length: number, mat: THREE.Material) {
  const g = new THREE.Group();
  g.add(hub(0.14, 0.07, mat));
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.07, length * 0.78, 0.055), mat);
  shaft.position.y = 0.22 + (length * 0.78) / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 8), mat);
  tip.position.y = length + 0.04;
  const luna = new THREE.Mesh(
    new THREE.ExtrudeGeometry(crescentShape(0.68, 0.44, 0.4), {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 28,
    }),
    mat,
  );
  luna.position.set(0, -0.72, -0.04);
  luna.rotation.z = -Math.PI / 2;
  luna.name = "seconds_luna";
  g.add(shaft, tip, luna);
  return g;
}

function blade(length: number, width: number, thick: number, curve: Curve, holes: "none" | "open") {
  const shape = leafShape(length, width, curve);
  if (holes === "open") punchAlmonds(shape, length);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: thick * 0.16,
    bevelSize: thick * 0.18,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geom.translate(0, 0, -thick / 2);
  return geom;
}

function hand(
  length: number,
  width: number,
  thick: number,
  hubR: number,
  curve: Curve,
  holes: "none" | "open",
  mat: THREE.Material,
  ridged: boolean,
) {
  const g = new THREE.Group();
  g.add(hub(hubR, thick, mat), new THREE.Mesh(blade(length, width, thick, curve, holes), mat));
  if (ridged) {
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(width * 0.08, 0.06), length * 0.62, 0.022),
      blued(0.08, 0x2e5080),
    );
    ridge.position.set(0, length * 0.48, thick / 2 + 0.01);
    g.add(ridge);
  }
  return g;
}

function arborNode(root: THREE.Object3D, name: "center" | "fourth"): THREE.Object3D | null {
  const motion = root.getObjectByName(`${name}_motion`);
  if (motion) return motion;
  return root.getObjectByName(`${name}_pose`) ?? null;
}

function setLocalZForWorldMm(mesh: THREE.Object3D, parent: THREE.Object3D, worldMm: number) {
  parent.add(mesh);
  parent.updateMatrixWorld(true);
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  parent.matrixWorld.decompose(pos, quat, scale);
  const sz = scale.z || MM;
  mesh.position.set(0, 0, (worldMm * MM - pos.z) / sz);
}

export function attachHands(trainRoot: THREE.Object3D, style: HandStyle = "fine"): THREE.Object3D[] {
  const fine = style === "fine";
  const open = style === "open";
  const curve = fine ? CURVE_FINE : CURVE_LEAF;
  const mat = fine ? blued(0.12, 0x163e78) : blued(0.14, 0x153a70);
  const bigHoles: "none" | "open" = open ? "open" : "none";

  const meshes: THREE.Object3D[] = [];
  const centerMotion = arborNode(trainRoot, "center");
  const centerPose = trainRoot.getObjectByName("center_pose");
  const fourthNode = arborNode(trainRoot, "fourth");

  const minuteW = fine ? 1.05 : 1.55;
  const hourW = fine ? 1.22 : 1.85;
  const minuteLen = 12.6;
  const hourLen = minuteLen * (9.05 / 14.15);
  const minute = hand(minuteLen, minuteW, 0.15, 0.18, curve, bigHoles, mat, fine);
  minute.name = "minute_hand";
  minute.rotation.z = THREE.MathUtils.degToRad(-(60 + 180));
  const minuteParent = centerMotion ?? centerPose;
  if (minuteParent) {
    setLocalZForWorldMm(minute, minuteParent, DIAL_SURFACE_MM + 0.72);
    meshes.push(minute);
  }

  const hour = hand(hourLen, hourW, 0.17, 0.2, curve, bigHoles, mat, fine);
  hour.name = "hour_hand";
  hour.rotation.z = THREE.MathUtils.degToRad(-(305 + 180));
  if (centerPose) {
    setLocalZForWorldMm(hour, centerPose, DIAL_SURFACE_MM + 0.32);
    meshes.push(hour);
  }

  const seconds =
    style === "leaf" ? infinitySeconds(3.02, mat) : style === "open" ? hand(3.02, 0.48, 0.1, 0.14, curve, "none", mat, false) : crescentSeconds(3.05, mat);
  seconds.name = "seconds_hand";
  seconds.rotation.z = 0;
  if (fourthNode) {
    setLocalZForWorldMm(seconds, fourthNode, WELL_FLOOR_MM + 0.16);
    meshes.push(seconds);
  }

  return meshes;
}
