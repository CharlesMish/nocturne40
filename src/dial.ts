/**
 * Closed cream dial in spec millimetres.
 * Index 12 at spec −Y so +180° wrapper reads 12 at world +Y.
 * Small-seconds at the fourth arbor. Warm metal only as the terrace edge at 6.
 */
import * as THREE from "three";
import { PART_AXES_MM } from "./plate";

export const MARKER_LANES = ["curve", "slim", "dauphine", "baton"] as const;
export type MarkerStyle = (typeof MARKER_LANES)[number];
const MM_SCALE = 0.001;
export const DIAL_Z = 3.52;
const DIAL_R = 15.7;
const SUB_R = 4.0;
export const DIAL_SURFACE = DIAL_Z + 0.28;
const FIELD_LIFT = 0.07;
const SECONDS_STEP = 0.13;
export const SECONDS_FLOOR = DIAL_SURFACE + FIELD_LIFT - SECONDS_STEP;
const STANDING = 0.32;
const fourth = PART_AXES_MM.fourth;

export type CreamLook = "current" | "light";
export type MarkerLook = "current" | "gun";

function creamTexture(look: CreamLook = "current") {
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 24, size / 2, size / 2, size * 0.5);
  if (look === "light") {
    g.addColorStop(0, "#f8f2ea");
    g.addColorStop(0.55, "#f0e3d1");
    g.addColorStop(1, "#e5d3bd");
  } else {
    g.addColorStop(0, "#f6efe4");
    g.addColorStop(0.55, "#eadcc8");
    g.addColorStop(1, "#dcc9ae");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 720; i++) {
    const a = (i / 720) * Math.PI * 2;
    ctx.strokeStyle = `rgba(92, 72, 52, ${0.012 + (i % 5) * 0.004})`;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.lineTo(size / 2 + Math.cos(a) * size * 0.55, size / 2 + Math.sin(a) * size * 0.55);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function dialUV(x: number, y: number) {
  return new THREE.Vector2(x / (DIAL_R * 2) + 0.5, y / (DIAL_R * 2) + 0.5);
}

const DIAL_UV = {
  generateTopUV(_geometry: THREE.ExtrudeGeometry, vertices: number[], a: number, b: number, c: number) {
    return [
      dialUV(vertices[a * 3], vertices[a * 3 + 1]),
      dialUV(vertices[b * 3], vertices[b * 3 + 1]),
      dialUV(vertices[c * 3], vertices[c * 3 + 1]),
    ];
  },
  generateSideWallUV(
    _geometry: THREE.ExtrudeGeometry,
    vertices: number[],
    a: number,
    b: number,
    c: number,
    d: number,
  ) {
    return [
      dialUV(vertices[a * 3], vertices[a * 3 + 1]),
      dialUV(vertices[b * 3], vertices[b * 3 + 1]),
      dialUV(vertices[c * 3], vertices[c * 3 + 1]),
      dialUV(vertices[d * 3], vertices[d * 3 + 1]),
    ];
  },
};

function creamFloorTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, "#f3eadf");
  g.addColorStop(1, "#e6d6c2");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const a = (i / 400) * Math.PI * 2;
    ctx.strokeStyle = `rgba(88, 70, 52, ${0.01 + (i % 7) * 0.003})`;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.lineTo(size / 2 + Math.cos(a) * size * 0.5, size / 2 + Math.sin(a) * size * 0.5);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function steelAccent(look: MarkerLook = "current") {
  return new THREE.MeshPhysicalMaterial({
    color: look === "gun" ? 0x2a333c : 0x5a564f,
    metalness: look === "gun" ? 0.88 : 0.9,
    roughness: look === "gun" ? 0.24 : 0.2,
    clearcoat: look === "gun" ? 0.14 : 0.08,
    clearcoatRoughness: look === "gun" ? 0.28 : 0.32,
  });
}

function rehautSteel() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc4c6ca,
    metalness: 0.7,
    roughness: 0.38,
  });
}

function steelPolish() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe2ded6,
    metalness: 0.96,
    roughness: 0.09,
    clearcoat: 0.22,
    clearcoatRoughness: 0.16,
  });
}

function roseGold() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc4a070,
    metalness: 0.62,
    roughness: 0.32,
    clearcoat: 0.06,
    clearcoatRoughness: 0.4,
  });
}

function latheZ(pts: THREE.Vector2[], segments = 80) {
  const geom = new THREE.LatheGeometry(pts, segments);
  geom.rotateX(Math.PI / 2);
  return geom;
}

function batonGeom(width: number, len: number, standing: number) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = len / 2;
  shape.moveTo(-hw * 0.92, -hl);
  shape.lineTo(hw * 0.92, -hl);
  shape.lineTo(hw, hl);
  shape.lineTo(-hw, hl);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: standing,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
  });
  geom.translate(0, 0, -standing / 2);
  return geom;
}

function dauphineGeom(width: number, len: number, standing: number) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = len / 2;
  shape.moveTo(0, -hl);
  shape.lineTo(hw, 0.05 * len);
  shape.lineTo(0, hl);
  shape.lineTo(-hw, 0.05 * len);
  shape.closePath();
  return extrudeIndex(shape, standing, 0.035, 0.03);
}

/** Stadium — same applied language as baton, round ends. */
function stadiumGeom(width: number, len: number, standing: number) {
  const shape = new THREE.Shape();
  const r = width / 2;
  const hy = Math.max(len / 2 - r, 0.12);
  shape.moveTo(-r, -hy);
  shape.absarc(0, -hy, r, Math.PI, 0, false);
  shape.lineTo(r, hy);
  shape.absarc(0, hy, r, 0, Math.PI, false);
  shape.closePath();
  return extrudeIndex(shape, standing, 0.012, 0.01);
}

function extrudeIndex(shape: THREE.Shape, standing: number, bevelThickness: number, bevelSize: number) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: standing,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geom.translate(0, 0, -standing / 2);
  return geom;
}

function indexSize(style: MarkerStyle, isTwelve: boolean) {
  switch (style) {
    case "slim":
      return { len: isTwelve ? 2.75 : 1.72, width: isTwelve ? 0.52 : 0.4, standing: 0.36 };
    case "dauphine":
      return { len: isTwelve ? 2.55 : 1.62, width: isTwelve ? 0.7 : 0.52, standing: STANDING };
    case "curve":
      return { len: isTwelve ? 2.58 : 1.58, width: isTwelve ? 0.44 : 0.34, standing: 0.34 };
    case "baton":
      return { len: isTwelve ? 2.58 : 1.58, width: isTwelve ? 0.62 : 0.48, standing: STANDING };
  }
}

function indexGeom(style: MarkerStyle, width: number, len: number, standing: number) {
  switch (style) {
    case "dauphine":
      return dauphineGeom(width, len, standing);
    case "curve":
      return stadiumGeom(width, len, standing);
    case "baton":
    case "slim":
      return batonGeom(width, len, standing);
  }
}

export function createDial(
  markers: MarkerStyle = "curve",
  cream: CreamLook = "current",
  appliedLook: MarkerLook = "current",
): THREE.Group {
  const root = new THREE.Group();
  root.name = "dial";

  const map = creamTexture(cream);
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: cream === "light" ? 0xf7f0e6 : 0xf4ebe0,
    map: map ?? undefined,
    metalness: 0.03,
    roughness: 0.48,
  });

  const shape = new THREE.Shape();
  shape.absarc(0, 0, DIAL_R, 0, Math.PI * 2, false);
  const pipe = new THREE.Path();
  pipe.absarc(0, 0, 0.52, 0, Math.PI * 2, true);
  shape.holes.push(pipe);
  const sub = new THREE.Path();
  sub.absarc(fourth.x, fourth.y, SUB_R - 0.03, 0, Math.PI * 2, true);
  shape.holes.push(sub);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.28,
    bevelEnabled: false,
    curveSegments: 64,
    UVGenerator: DIAL_UV,
  });
  geom.translate(0, 0, DIAL_Z);
  const uv = geom.attributes.uv;
  const pos = geom.attributes.position;
  if (uv && pos) {
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) / (DIAL_R * 2) + 0.5, pos.getY(i) / (DIAL_R * 2) + 0.5);
    }
    uv.needsUpdate = true;
  }
  const face = new THREE.Mesh(geom, faceMat);
  face.name = "dial_face";
  root.add(face);

  const FIELD_R = 12.2;
  const padShape = new THREE.Shape();
  padShape.absarc(0, 0, FIELD_R, 0, Math.PI * 2, false);
  const padPipe = new THREE.Path();
  padPipe.absarc(0, 0, 0.52, 0, Math.PI * 2, true);
  padShape.holes.push(padPipe);
  const padWell = new THREE.Path();
  padWell.absarc(fourth.x, fourth.y, SUB_R + 0.02, 0, Math.PI * 2, true);
  padShape.holes.push(padWell);
  const padGeom = new THREE.ExtrudeGeometry(padShape, {
    depth: FIELD_LIFT,
    bevelEnabled: false,
    curveSegments: 64,
    UVGenerator: DIAL_UV,
  });
  const pad = new THREE.Mesh(padGeom, faceMat);
  pad.position.z = DIAL_SURFACE;
  pad.name = "dial_field";
  root.add(pad);

  const fieldTop = DIAL_SURFACE + FIELD_LIFT;
  const floorMap = creamFloorTexture();
  const wellFloor = new THREE.Mesh(
    new THREE.CircleGeometry(SUB_R - 0.04, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xf1e6d8,
      map: floorMap ?? undefined,
      metalness: 0.03,
      roughness: 0.58,
    }),
  );
  wellFloor.position.set(fourth.x, fourth.y, SECONDS_FLOOR);
  wellFloor.name = "seconds_well";
  root.add(wellFloor);

  const stepEdge = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(SUB_R - 0.05, SECONDS_FLOOR),
      new THREE.Vector2(SUB_R + 0.028, SECONDS_FLOOR + 0.018),
      new THREE.Vector2(SUB_R + 0.022, fieldTop),
      new THREE.Vector2(SUB_R - 0.02, fieldTop),
      new THREE.Vector2(SUB_R - 0.05, SECONDS_FLOOR),
    ]),
    roseGold(),
  );
  stepEdge.position.set(fourth.x, fourth.y, 0);
  stepEdge.name = "seconds_step_edge";
  root.add(stepEdge);

  const rehautShape = new THREE.Shape();
  rehautShape.absarc(0, 0, DIAL_R + 1.12, 0, Math.PI * 2, false);
  const rehautHole = new THREE.Path();
  rehautHole.absarc(0, 0, DIAL_R + 0.08, 0, Math.PI * 2, true);
  rehautShape.holes.push(rehautHole);
  const rehaut = new THREE.Mesh(
    new THREE.ExtrudeGeometry(rehautShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.06,
      bevelSegments: 2,
      curveSegments: 64,
    }),
    rehautSteel(),
  );
  rehaut.position.z = DIAL_SURFACE - 0.01;
  rehaut.name = "rehaut";
  root.add(rehaut);

  const applied = steelAccent(appliedLook);
  const facet = steelPolish();
  const withFacet = markers === "baton" || markers === "slim" || markers === "curve";
  for (let k = 0; k < 12; k++) {
    if (k === 6) continue;
    const worldX = Math.sin((k * Math.PI) / 6);
    const worldY = Math.cos((k * Math.PI) / 6);
    const specX = -worldX;
    const specY = -worldY;
    const isTwelve = k === 0;
    const yieldToSix = k === 5 || k === 7;
    const { len, width, standing } = indexSize(markers, isTwelve);
    const usedLen = yieldToSix ? len * 0.74 : len;
    const outer = DIAL_R - 0.38;
    const midR = outer - usedLen / 2;
    const baton = new THREE.Mesh(indexGeom(markers, width, usedLen, standing), applied);
    baton.position.set(specX * midR, specY * midR, fieldTop + standing / 2 + 0.02);
    baton.rotation.z = Math.atan2(specX, specY);
    baton.name = `index_${k === 0 ? 12 : k}`;
    if (withFacet) {
      const polish =
        markers === "curve"
          ? new THREE.Mesh(stadiumGeom(width * 0.72, usedLen * 0.78, 0.022), facet)
          : new THREE.Mesh(
              new THREE.BoxGeometry(width * (markers === "slim" ? 0.62 : 0.68), usedLen * 0.78, 0.022),
              facet,
            );
      polish.position.z = standing / 2;
      polish.name = `${baton.name}_facet`;
      baton.add(polish);
    }
    root.add(baton);
  }

  const cannonMat = steelAccent(appliedLook);
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 20), cannonMat);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 0, fieldTop + 0.02);
  cannon.name = "center_cannon";
  root.add(cannon);

  const subPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.08, 16), cannonMat);
  subPipe.rotation.x = Math.PI / 2;
  subPipe.position.set(fourth.x, fourth.y, SECONDS_FLOOR + 0.05);
  subPipe.name = "seconds_pipe";
  root.add(subPipe);

  root.scale.setScalar(MM_SCALE);
  return root;
}
