/**
 * Closed cream dial in spec millimetres.
 * Index 12 at spec −Y so +180° wrapper reads 12 at world +Y.
 * Small-seconds at the fourth arbor. Warm metal only as the terrace edge at 6.
 */
import * as THREE from "three";
import { PART_AXES_MM } from "./plate";
import { designStudy, executionFinish, physicalFinish, preciseFamily, dressFamily, warmer, containment, type DesignVariant } from "./design";

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
export type RehautLook = "current" | "family" | "quiet" | "slope" | "lift";
export const TICK_LANES = ["t0", "t1"] as const;
export type TickLane = (typeof TICK_LANES)[number];

export function tickLane(): TickLane {
  const v = new URLSearchParams(location.search).get("ticks");
  if (v === "t1" || v === "1") return "t1";
  return "t0";
}

/** Interpolate opponent chroma in OKLab, retaining the base lightness.
 * Lane 1's map is multiplied by its face tint before deriving the donor. */
function warmColor(base: string, donor: string) {
  const lab = (c: THREE.Color) => {
    const l = Math.cbrt(.4122214708*c.r+.5363325363*c.g+.0514459929*c.b);
    const m = Math.cbrt(.2119034982*c.r+.6806995451*c.g+.1073969566*c.b);
    const s = Math.cbrt(.0883024619*c.r+.2817188376*c.g+.6299787005*c.b);
    return [.2104542553*l+.793617785*m-.0040720468*s, 1.9779984951*l-2.428592205*m+.4505937099*s, .0259040371*l+.7827717662*m-.808675766*s];
  };
  const [L,a,b] = lab(new THREE.Color(base));
  const [,da,db] = lab(new THREE.Color(donor).multiply(new THREE.Color(0xf4ebe0)));
  const A = a*.75+da*.25, B = b*.75+db*.25;
  const l = (L+.3963377774*A+.2158037573*B)**3;
  const m = (L-.1055613458*A-.0638541728*B)**3;
  const s = (L-.0894841775*A-1.291485548*B)**3;
  return new THREE.Color().setRGB(4.0767416621*l-3.3077115913*m+.2309699292*s, -1.2684380046*l+2.6097574011*m-.3413193965*s, -.0041960863*l-.7034186147*m+1.707614701*s).getStyle();
}

function creamTexture(look: CreamLook = "current", design: DesignVariant = "baseline") {
  const study = designStudy(design);
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 24, size / 2, size / 2, size * 0.5);
  if (study) {
    g.addColorStop(0, warmer(design) ? warmColor(study.dialCenter, "#f6efe4") : study.dialCenter);
    g.addColorStop(1, warmer(design) ? warmColor(study.dialEdge, "#dcc9ae") : study.dialEdge);
  } else if (look === "light") {
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
    ctx.strokeStyle = `rgba(92, 72, 52, ${study ? 0.002 + (i % 5) * 0.001 : 0.012 + (i % 5) * 0.004})`;
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

function rehautSteel(look: RehautLook = "current") {
  if (look === "quiet") {
    return new THREE.MeshPhysicalMaterial({
      color: 0xf4ebe0,
      metalness: 0.03,
      roughness: 0.5,
    });
  }
  if (look === "family") {
    return new THREE.MeshPhysicalMaterial({
      color: 0x7c8086,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.12,
      clearcoatRoughness: 0.22,
      specularIntensity: 1,
    });
  }
  if (look === "slope" || look === "lift") {
    return new THREE.MeshPhysicalMaterial({
      color: look === "lift" ? 0x8c9096 : 0x7c8086,
      metalness: 0.96,
      roughness: 0.09,
      clearcoat: 0.06,
      clearcoatRoughness: 0.3,
      specularIntensity: 1,
    });
  }
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

function studyIndexGeom(width: number, len: number, standing: number, soft: boolean) {
  const shape = new THREE.Shape();
  const w = width / 2, h = len / 2;
  shape.moveTo(-w * (soft ? 0.18 : 0.68), -h);
  shape.lineTo(w * (soft ? 0.18 : 0.68), -h);
  if (soft) {
    shape.quadraticCurveTo(w * 0.7, -h * 0.5, w, h * 0.7);
    shape.quadraticCurveTo(w, h, w * 0.6, h);
    shape.lineTo(-w * 0.6, h);
    shape.quadraticCurveTo(-w, h, -w, h * 0.7);
    shape.quadraticCurveTo(-w * 0.7, -h * 0.5, -w * 0.18, -h);
  } else {
    shape.lineTo(w, h); shape.lineTo(-w, h);
  }
  shape.closePath();
  return extrudeIndex(shape, standing, 0.012, 0.008);
}

export function createDial(
  markers: MarkerStyle = "curve",
  cream: CreamLook = "current",
  appliedLook: MarkerLook = "current",
  rehautLook: RehautLook = "current",
  design: DesignVariant = "baseline",
): THREE.Group {
  const study = designStudy(design);
  const root = new THREE.Group();
  root.name = "dial";

  const map = creamTexture(cream, physicalFinish() && preciseFamily(design) ? "warm" : design);
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: study ? 0xffffff : cream === "light" ? 0xf7f0e6 : 0xf4ebe0,
    map: map ?? undefined,
    metalness: study?.dialMetalness ?? 0.03,
    roughness: study?.dialRoughness ?? 0.48,
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

  // The control has a 12.2 mm raised central disc. The new faces carry that
  // surface through to the edge, removing the visible circular step by design.
  const FIELD_R = study ? DIAL_R : 12.2;
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
      color: warmer(design) && !physicalFinish() ? warmColor("#e7e2d5", "#f1e6d8") : study?.floor ?? 0xf1e6d8,
      map: study ? undefined : floorMap ?? undefined,
      metalness: 0.03,
      roughness: 0.58,
    }),
  );
  wellFloor.position.set(fourth.x, fourth.y, SECONDS_FLOOR);
  wellFloor.name = "seconds_well";
  root.add(wellFloor);

  if (tickLane() === "t1" || preciseFamily(design)) {
    const tickMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a333c,
      metalness: 0.28,
      roughness: 0.46,
      specularIntensity: 0.18,
    });
    const innerR = SUB_R - 0.055;
    const z = SECONDS_FLOOR + 0.01;
    for (let i = 0; i < 12; i++) {
      const cardinal = i % 3 === 0;
      const len = preciseFamily(design) ? (cardinal ? 0.34 : 0.2) : cardinal ? 0.2 : 0.13;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(preciseFamily(design) ? 0.048 : 0.032, len, 0.016), tickMat);
      const a = Math.PI + (i * Math.PI) / 6;
      const dirX = Math.sin(a);
      const dirY = Math.cos(a);
      const midR = innerR - len / 2;
      tick.position.set(fourth.x + dirX * midR, fourth.y + dirY * midR, z);
      tick.rotation.z = (study ? -1 : 1) * Math.atan2(dirX, dirY);
      tick.name = `seconds_tick_${i * 5}`;
      root.add(tick);
    }
  }

  const stepEdge = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(SUB_R - 0.05, SECONDS_FLOOR),
      new THREE.Vector2(SUB_R + 0.028, SECONDS_FLOOR + 0.018),
      new THREE.Vector2(SUB_R + 0.022, fieldTop),
      new THREE.Vector2(SUB_R - 0.02, fieldTop),
      new THREE.Vector2(SUB_R - 0.05, SECONDS_FLOOR),
    ]),
    design === "sculptural" ? new THREE.MeshPhysicalMaterial({color: 0xb4aea0, metalness: 0.45, roughness: 0.42}) : roseGold(),
  );
  stepEdge.position.set(fourth.x, fourth.y, 0);
  stepEdge.name = "seconds_step_edge";
  root.add(stepEdge);

  if (design === "sculptural") {
    // A stationary lower crescent surrounds the circular sweep. Local +Y is
    // product six after the wrapper turn; its tapered tips never cover the well.
    const crescent = new THREE.Shape();
    const points: THREE.Vector2[] = [];
    const inner = SUB_R + 0.04;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80, a = -1.7 + 3.4 * t;
      const radius = inner + 0.008 + 0.28 * Math.sin(Math.PI * t) ** 1.3;
      points.push(new THREE.Vector2(Math.sin(a) * radius, Math.cos(a) * radius));
    }
    for (let i = 80; i >= 0; i--) {
      const a = -1.7 + 3.4 * i / 80;
      points.push(new THREE.Vector2(Math.sin(a) * inner, Math.cos(a) * inner));
    }
    crescent.setFromPoints(points);
    crescent.closePath();
    const accent = new THREE.Mesh(new THREE.ExtrudeGeometry(crescent, {depth: 0.018, bevelEnabled: false}), roseGold());
    accent.position.set(fourth.x, fourth.y, fieldTop + 0.004);
    accent.name = "seconds_crescent";
    root.add(accent);
  }

  if (preciseFamily(design)) {
    const ink = new THREE.MeshBasicMaterial({color: 0x525a5b});
    for (let i = 0; i < 60; i++) {
      const hour = i % 5 === 0, len = hour ? 0.42 : 0.25;
      const a = Math.PI + i / 60 * Math.PI * 2;
      const radius = 15.2 - len / 2;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(hour ? 0.052 : 0.032, len, 0.012), ink);
      tick.position.set(Math.sin(a) * radius, Math.cos(a) * radius, fieldTop + 0.01);
      tick.rotation.z = -a;
      tick.name = `minute_tick_${i}`;
      root.add(tick);
    }
  }

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
    rehautSteel(rehautLook),
  );
  rehaut.position.z = DIAL_SURFACE - 0.01;
  rehaut.name = "rehaut";
  if (study) {
    const mat = rehaut.material;
    mat.color.setHex(design === "sculptural" ? 0xe8e2d5 : 0xa3a6a4);
    mat.metalness = design === "sculptural" ? 0.12 : 0.9;
    mat.roughness = design === "sculptural" ? 0.34 : 0.21;
  }
  if (containment(design)) { rehaut.material.color.setHex(0x777b7a); rehaut.material.roughness = 0.32; }
  root.add(rehaut);

  const applied = steelAccent(appliedLook);
  const facet = steelPolish();
  if (study) { applied.color.setHex(0x737c81); applied.roughness = 0.28; }
  if (executionFinish() && preciseFamily(design)) {
    applied.color.setHex(0x3b4750); applied.metalness=.75; applied.roughness=.36;
    facet.color.setHex(0x8b949a); facet.roughness=.24;
  }
  const withFacet = markers === "baton" || markers === "slim" || markers === "curve";
  for (let k = 0; k < 12; k++) {
    if (k === 6) continue;
    const worldX = Math.sin((k * Math.PI) / 6);
    const worldY = Math.cos((k * Math.PI) / 6);
    const specX = -worldX;
    const specY = -worldY;
    const isTwelve = k === 0;
    const yieldToSix = k === 5 || k === 7;
    const custom = study && markers === "curve";
    const size = custom ? {
      len: isTwelve ? study.twelveLength : study.markerLength,
      width: study.markerWidth * (isTwelve ? 1.25 : 1), standing: 0.28,
    } : indexSize(markers, isTwelve);
    const refined = dressFamily(design) && markers === "curve";
    // The full 15% at 12 enters the unchanged minute hand's swept radius.
    // Cap only that marker to leave ~0.06 mm radial clearance, including bevel.
    const len = refined && isTwelve ? 2.9 : size.len * (refined ? 1.15 : 1);
    const width = size.width * (refined ? 1.1 : 1);
    const standing = size.standing;
    const usedLen = yieldToSix ? len * 0.74 : len;
    const outer = custom ? study.markerOuter : DIAL_R - 0.38;
    const midR = outer - usedLen / 2;
    const markerGeometry = custom ? studyIndexGeom(width, usedLen, standing, design === "sculptural") : indexGeom(markers, width, usedLen, standing);
    const baton = new THREE.Mesh(markerGeometry, applied);
    baton.position.set(specX * midR, specY * midR, fieldTop + standing / 2 + 0.02);
    baton.rotation.z = (study ? -1 : 1) * Math.atan2(specX, specY);
    baton.name = `index_${k === 0 ? 12 : k}`;
    if (withFacet) {
      const polish =
        custom
          ? new THREE.Mesh(studyIndexGeom(width * (executionFinish() ? 0.22 : 0.42), usedLen * 0.72, 0.022, design === "sculptural"), facet)
          : markers === "curve"
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
