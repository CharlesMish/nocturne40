/**
 * Late-swell folded-leaf hands in spec millimetres.
 * Parent is a GLB arbor (already under root scale 0.001) — do not scale again.
 *
 * Default A: leaf counterweight. C / ?cw=open toggles two-lobe B.
 */
import * as THREE from "three";
import { DIAL_SURFACE, SECONDS_FLOOR } from "./dial";

const MM = 0.001;

export const SECONDS_BALANCES = ["leaf", "open"] as const;
export type SecondsBalance = (typeof SECONDS_BALANCES)[number];

/** Kept so old ?hands= URLs do not crash; production geometry is the swell family. */
export const HAND_LANES = SECONDS_BALANCES;
export type HandStyle = SecondsBalance;

function navy(roughness = 0.26, color = 0x1a355c) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.42,
    roughness,
    envMapIntensity: 0.22,
    clearcoat: 0.08,
    clearcoatRoughness: 0.4,
    specularIntensity: 0.45,
  });
}

function hub(radius: number, thick: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thick + 0.02, 24), mat);
  disc.rotation.x = Math.PI / 2;
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, thick + 0.028, 16), navy(0.3, 0x152a48));
  pit.rotation.x = Math.PI / 2;
  g.add(disc, pit);
  return g;
}

type SwellSpec = {
  neckEnd: number;
  peak: number;
  neckW: number;
  maxW: number;
  tipW: number;
};

const HOUR_SWELL: SwellSpec = {
  neckEnd: 0.12,
  peak: 0.52,
  neckW: 0.28,
  maxW: 1.34,
  tipW: 0.1,
};

const MINUTE_SWELL: SwellSpec = {
  neckEnd: 0.15,
  peak: 0.58,
  neckW: 0.22,
  maxW: 0.96,
  tipW: 0.07,
};

const BALANCE_SWELL: SwellSpec = {
  neckEnd: 0.2,
  peak: 0.5,
  neckW: 0.14,
  maxW: 0.4,
  tipW: 0.06,
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function swellHalfWidth(t: number, spec: SwellSpec) {
  const u = Math.min(1, Math.max(0, t));
  if (u <= spec.neckEnd) {
    const s = u / spec.neckEnd;
    return lerp(spec.neckW, spec.neckW * 1.12, s) / 2;
  }
  if (u <= spec.peak) {
    const s = (u - spec.neckEnd) / (spec.peak - spec.neckEnd);
    const ease = s * s * (3 - 2 * s);
    return lerp(spec.neckW * 1.12, spec.maxW, ease) / 2;
  }
  const s = (u - spec.peak) / (1 - spec.peak);
  const straight = 0.1 * s * s + 0.9 * s;
  return lerp(spec.maxW, spec.tipW, straight) / 2;
}

function swellShape(length: number, spec: SwellSpec, y0: number) {
  const shape = new THREE.Shape();
  const n = 48;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = y0 + (length - y0) * t;
    const hw = swellHalfWidth(y / length, spec);
    pts.push(new THREE.Vector2(Math.max(spec.tipW * 0.45, hw), y));
  }
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  for (let i = pts.length - 2; i >= 0; i--) shape.lineTo(-pts[i].x, pts[i].y);
  shape.closePath();
  return shape;
}

function extrudePlan(shape: THREE.Shape, thick: number) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geom.translate(0, 0, -thick / 2);
  return geom;
}

function ridgeMesh(length: number, spec: SwellSpec, thick: number) {
  const y0 = length * 0.22;
  const y1 = length * 0.52;
  const shape = new THREE.Shape();
  const n = 20;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const y = y0 + (y1 - y0) * u;
    const edge = u < 0.08 || u > 0.92 ? 0.35 : 1;
    const hw = swellHalfWidth(y / length, spec) * 0.2 * edge;
    pts.push(new THREE.Vector2(Math.max(0.018, hw), y));
  }
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i].x, pts[i].y);
  shape.closePath();
  const mesh = new THREE.Mesh(extrudePlan(shape, thick * 0.22), navy(0.2, 0x244a78));
  mesh.position.z = thick / 2 + 0.004;
  mesh.name = "hand_ridge";
  return mesh;
}

function foldedLeaf(
  length: number,
  spec: SwellSpec,
  thick: number,
  hubR: number,
  mat: THREE.Material,
  withRidge: boolean,
) {
  const g = new THREE.Group();
  const y0 = 0.02;
  if (hubR > 0) g.add(hub(hubR, thick, mat));
  const blade = new THREE.Mesh(extrudePlan(swellShape(length, spec, y0), thick), mat);
  blade.name = "hand_blade";
  g.add(blade);
  if (withRidge) g.add(ridgeMesh(length, spec, thick));
  return g;
}

function secondsNeedle(length: number, mat: THREE.Material) {
  const shape = new THREE.Shape();
  shape.moveTo(0.03, 0.1);
  shape.lineTo(0.022, length * 0.6);
  shape.lineTo(0.014, length);
  shape.lineTo(-0.014, length);
  shape.lineTo(-0.022, length * 0.6);
  shape.lineTo(-0.03, 0.1);
  shape.closePath();
  return new THREE.Mesh(extrudePlan(shape, 0.05), mat);
}

/** Needle, hub, and leaf counterweight as one outline so the subdial hand does not split. */
function secondsLeaf(mat: THREE.Material) {
  const L = 3.02;
  const C = 0.66;
  const shape = new THREE.Shape();
  shape.moveTo(0, -C);
  shape.lineTo(0.05, -C * 0.58);
  shape.lineTo(0.19, -C * 0.22);
  shape.lineTo(0.1, -0.04);
  shape.lineTo(0.03, 0.1);
  shape.lineTo(0.022, L * 0.6);
  shape.lineTo(0.014, L);
  shape.lineTo(-0.014, L);
  shape.lineTo(-0.022, L * 0.6);
  shape.lineTo(-0.03, 0.1);
  shape.lineTo(-0.1, -0.04);
  shape.lineTo(-0.19, -C * 0.22);
  shape.lineTo(-0.05, -C * 0.58);
  shape.closePath();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(extrudePlan(shape, 0.05), mat), hub(0.1, 0.055, mat));
  return g;
}

/** Two lobes from the same swell, slit on the centerline — not a moon graphic. */
function openBalance(mat: THREE.Material) {
  const g = new THREE.Group();
  g.name = "seconds_balance";
  const len = 0.78;
  const spec = BALANCE_SWELL;
  const n = 24;
  const makeLobe = (sign: 1 | -1) => {
    const shape = new THREE.Shape();
    const gap = 0.03;
    const y0 = 0.04;
    shape.moveTo(sign * gap, y0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = y0 + (len - y0) * t;
      let hw = swellHalfWidth(y / len, spec);
      if (t > 0.88) hw *= 1 - (t - 0.88) / 0.12;
      shape.lineTo(sign * (gap + hw), y);
    }
    shape.lineTo(sign * gap, len);
    shape.closePath();
    const mesh = new THREE.Mesh(extrudePlan(shape, 0.065), mat);
    mesh.rotation.z = Math.PI;
    return mesh;
  };
  g.add(hub(0.1, 0.065, mat), makeLobe(1), makeLobe(-1));
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

export function attachHands(trainRoot: THREE.Object3D, style: SecondsBalance = "leaf"): THREE.Object3D[] {
  const mat = navy();
  const meshes: THREE.Object3D[] = [];
  const centerMotion = arborNode(trainRoot, "center");
  const centerPose = trainRoot.getObjectByName("center_pose");
  const fourthNode = arborNode(trainRoot, "fourth");

  const minuteLen = 12.35;
  const hourLen = 8.05;

  const minute = foldedLeaf(minuteLen, MINUTE_SWELL, 0.14, 0, mat, true);
  minute.name = "minute_hand";
  minute.rotation.z = THREE.MathUtils.degToRad(-(60 + 180));
  const minuteParent = centerMotion ?? centerPose;
  if (minuteParent) {
    setLocalZForWorldMm(minute, minuteParent, DIAL_SURFACE + 0.7);
    meshes.push(minute);
  }

  const hour = foldedLeaf(hourLen, HOUR_SWELL, 0.16, 0.24, mat, true);
  hour.name = "hour_hand";
  hour.rotation.z = THREE.MathUtils.degToRad(-(305 + 180));
  if (centerPose) {
    setLocalZForWorldMm(hour, centerPose, DIAL_SURFACE + 0.32);
    meshes.push(hour);
  }

  const seconds = new THREE.Group();
  seconds.name = "seconds_hand";
  seconds.add(style === "open" ? openBalance(mat) : secondsLeaf(mat));
  if (style === "open") seconds.add(secondsNeedle(3.02, mat));
  seconds.rotation.z = 0;
  if (fourthNode) {
    setLocalZForWorldMm(seconds, fourthNode, SECONDS_FLOOR + 0.14);
    meshes.push(seconds);
  }

  return meshes;
}
