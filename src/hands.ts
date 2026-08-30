/**
 * Heat-blued leaf hands in spec millimetres.
 * Parent is a GLB arbor (already under root scale 0.001) — do not scale again.
 *
 * H cycles: fine (default, tighter leaf + infinity seconds) → leaf (v0) → open.
 */
import * as THREE from "three";

const MM = 0.001;
const DIAL_SURFACE_MM = 3.52 + 0.28;
const SUBDIAL_TOP_MM = DIAL_SURFACE_MM + 0.12;

export const HAND_LANES = ["fine", "leaf", "open"] as const;
export type HandStyle = (typeof HAND_LANES)[number];

function blued(roughness = 0.26, color = 0x24365c) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.92,
    roughness,
    envMapIntensity: 0,
  });
}

function hub(radius: number, thick: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick + 0.05, 22), mat);
  disc.rotation.x = Math.PI / 2;
  const eye = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, thick + 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9c4bb, metalness: 0.85, roughness: 0.28, envMapIntensity: 0 }),
  );
  eye.rotation.x = Math.PI / 2;
  g.add(disc, eye);
  return g;
}

type Curve = { belly: number; waist: number; tip: number; root: number };

const CURVE_LEAF: Curve = { belly: 0.55, waist: 0.48, tip: 0.16, root: 0.82 };
const CURVE_FINE: Curve = { belly: 0.42, waist: 0.34, tip: 0.11, root: 0.78 };

function leafShape(length: number, width: number, curve: Curve) {
  const shape = new THREE.Shape();
  shape.moveTo(0.18, curve.root);
  shape.bezierCurveTo(width * curve.belly, length * 0.28, width * curve.waist, length * 0.58, curve.tip, length);
  shape.lineTo(-curve.tip, length);
  shape.bezierCurveTo(-width * curve.waist, length * 0.58, -width * curve.belly, length * 0.28, -0.18, curve.root);
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

/** Two twisted ribbons that cross — figure-8 / Möbius, still points at the tip. */
function infinitySeconds(length: number, mat: THREE.Material) {
  const g = new THREE.Group();
  g.add(hub(0.24, 0.15, mat));
  const strandA: THREE.Vector3[] = [];
  const strandB: THREE.Vector3[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = 0.5 + t * (length - 0.55);
    const loop = Math.sin(t * Math.PI * 2);
    const envelope = 0.52 * Math.sin(t * Math.PI);
    const x = loop * envelope;
    const z = 0.08 * Math.sin(t * Math.PI);
    strandA.push(new THREE.Vector3(x, y, z));
    strandB.push(new THREE.Vector3(-x, y, -z));
  }
  strandA[strandA.length - 1] = new THREE.Vector3(0, length, 0);
  strandB[strandB.length - 1] = new THREE.Vector3(0, length, 0);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandA), 32, 0.055, 7, false), mat));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strandB), 32, 0.055, 7, false), mat));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 8), mat);
  tip.position.y = length + 0.04;
  g.add(tip);
  return g;
}

function sitMat(opacity: number) {
  return new THREE.MeshBasicMaterial({
    color: 0x3f352c,
    transparent: true,
    opacity,
    depthWrite: false,
  });
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
  const sit = new THREE.Mesh(blade(length, width * 1.1, 0.02, curve, holes), sitMat(0.11));
  sit.position.z = -thick * 0.62;
  sit.name = "hand_sit";
  g.add(hub(hubR, thick, mat), sit, new THREE.Mesh(blade(length, width, thick, curve, holes), mat));
  if (ridged) {
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(width * 0.11, 0.13), length * 0.68, 0.04),
      blued(0.07, 0x3a5274),
    );
    ridge.position.set(0, length * 0.48, thick / 2 + 0.014);
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
  const mat = fine ? blued(0.15, 0x2a3d62) : blued();
  const bigHoles: "none" | "open" = open ? "open" : "none";

  const meshes: THREE.Object3D[] = [];
  const centerMotion = arborNode(trainRoot, "center");
  const centerPose = trainRoot.getObjectByName("center_pose");
  const fourthNode = arborNode(trainRoot, "fourth");

  const minute = hand(13.4, 2.05, 0.26, 0.5, curve, bigHoles, mat, fine);
  minute.name = "minute_hand";
  minute.rotation.z = THREE.MathUtils.degToRad(-(60 + 180));
  const minuteParent = centerMotion ?? centerPose;
  if (minuteParent) {
    setLocalZForWorldMm(minute, minuteParent, DIAL_SURFACE_MM + 0.32);
    meshes.push(minute);
  }

  const hour = hand(8.85, 2.45, 0.3, 0.56, curve, bigHoles, mat, fine);
  hour.name = "hour_hand";
  hour.rotation.z = THREE.MathUtils.degToRad(-(305 + 180));
  if (centerPose) {
    setLocalZForWorldMm(hour, centerPose, DIAL_SURFACE_MM + 0.38);
    meshes.push(hour);
  }

  const seconds = style === "leaf" ? hand(3.15, 1.05, 0.16, 0.26, curve, "none", mat, false) : infinitySeconds(3.2, mat);
  seconds.name = "seconds_hand";
  seconds.rotation.z = 0;
  if (fourthNode) {
    setLocalZForWorldMm(seconds, fourthNode, SUBDIAL_TOP_MM + 0.18);
    meshes.push(seconds);
  }

  return meshes;
}
