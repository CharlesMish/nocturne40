/**
 * Closed cream dial in spec millimetres.
 * Index 12 at spec −Y so +180° wrapper reads 12 at world +Y.
 * Small-seconds at the fourth arbor. Rose-gold only on that ring.
 */
import * as THREE from "three";
import { PART_AXES_MM } from "./plate";

export const MARKER_LANES = ["baton", "slim", "dauphine", "curve", "infinity"] as const;
export type MarkerStyle = (typeof MARKER_LANES)[number];
export const FACE_LANES = ["cream", "nocturne", "n40"] as const;
export type FaceStyle = (typeof FACE_LANES)[number];
const MM_SCALE = 0.001;
export const DIAL_Z = 3.52;
const DIAL_R = 15.35;
const SUB_R = 3.55;
const DIAL_SURFACE = DIAL_Z + 0.28;
const STANDING = 0.32;
const fourth = PART_AXES_MM.fourth;

function creamTexture() {
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 24, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, "#f8f3ea");
  g.addColorStop(0.55, "#f0e6d6");
  g.addColorStop(1, "#e4d6c2");
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
  const toPx = (specX: number, specY: number) => {
    const u = specX / (DIAL_R * 2) + 0.5;
    const v = specY / (DIAL_R * 2) + 0.5;
    return { x: u * size, y: (1 - v) * size };
  };
  const outer = DIAL_R - 0.22;
  const innerMin = DIAL_R - 0.52;
  const innerHour = DIAL_R - 0.78;
  ctx.strokeStyle = "rgba(86, 70, 54, 0.5)";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  const ring = toPx(outer, 0);
  ctx.arc(size / 2, size / 2, Math.hypot(ring.x - size / 2, ring.y - size / 2), 0, Math.PI * 2);
  ctx.stroke();
  for (let m = 0; m < 60; m++) {
    const worldX = Math.sin((m * Math.PI) / 30);
    const worldY = Math.cos((m * Math.PI) / 30);
    const specX = -worldX;
    const specY = -worldY;
    const hour = m % 5 === 0;
    const inner = hour ? innerHour : innerMin;
    const a = toPx(specX * inner, specY * inner);
    const b = toPx(specX * outer, specY * outer);
    ctx.strokeStyle = hour ? "rgba(72, 56, 42, 0.68)" : "rgba(86, 70, 54, 0.48)";
    ctx.lineWidth = hour ? 7.5 : 4.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
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

function ink() {
  return new THREE.MeshStandardMaterial({
    color: 0x6a5848,
    metalness: 0.06,
    roughness: 0.7,
  });
}

function sitMat(opacity: number) {
  return new THREE.MeshBasicMaterial({
    color: 0x3f352c,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

function wordmark(title: string, widthMm: number, subtitle?: string) {
  const w = 2048;
  const h = subtitle ? 720 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = "Georgia, 'Palatino Linotype', 'Times New Roman', serif";
  if (subtitle) {
    ctx.fillStyle = "rgba(86, 70, 54, 0.48)";
    ctx.font = `500 248px ${font}`;
    ctx.fillText(title, w / 2, h * 0.34);
    ctx.fillStyle = "rgba(86, 70, 54, 0.32)";
    ctx.font = `300 132px ${font}`;
    ctx.fillText(subtitle, w / 2, h * 0.7);
  } else {
    ctx.fillStyle = "rgba(86, 70, 54, 0.46)";
    ctx.font = `400 300px ${font}`;
    ctx.fillText(title, w / 2, h / 2 + 12);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthMm, widthMm * (h / w)),
    new THREE.MeshStandardMaterial({
      map: tex,
      color: 0x8d7b68,
      transparent: true,
      depthWrite: false,
      metalness: 0,
      roughness: 0.9,
      envMapIntensity: 0,
    }),
  );
  mesh.name = "wordmark";
  return mesh;
}

function steelAccent() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc9c4bb,
    metalness: 0.78,
    roughness: 0.28,
  });
}

function steelPolish() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd2cdc4,
    metalness: 0.86,
    roughness: 0.22,
  });
}

function roseGold() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc4a07a,
    metalness: 0.9,
    roughness: 0.22,
  });
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
  return extrudeIndex(shape, standing, 0.045, 0.045);
}

/** Pinched almond — dauphine silhouette with the infinity waist, not a Möbius on every hour. */
function infinityGeom(width: number, len: number, standing: number) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = len / 2;
  shape.moveTo(0, -hl);
  shape.bezierCurveTo(hw * 0.85, -hl * 0.68, hw * 1.08, -hl * 0.28, hw * 0.2, 0);
  shape.bezierCurveTo(hw * 1.08, hl * 0.28, hw * 0.85, hl * 0.68, 0, hl);
  shape.bezierCurveTo(-hw * 0.85, hl * 0.68, -hw * 1.08, hl * 0.28, -hw * 0.2, 0);
  shape.bezierCurveTo(-hw * 1.08, -hl * 0.28, -hw * 0.85, -hl * 0.68, 0, -hl);
  shape.closePath();
  return extrudeIndex(shape, standing, 0.04, 0.035);
}

function extrudeIndex(shape: THREE.Shape, standing: number, bevelThickness: number, bevelSize: number) {
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: standing,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 2,
    curveSegments: 16,
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
      return { len: isTwelve ? 2.72 : 1.72, width: isTwelve ? 0.56 : 0.42, standing: 0.42 };
    case "infinity":
      return { len: isTwelve ? 2.68 : 1.7, width: isTwelve ? 0.82 : 0.62, standing: 0.34 };
    case "baton":
      return { len: isTwelve ? 2.55 : 1.62, width: isTwelve ? 0.72 : 0.58, standing: STANDING };
  }
}

function indexGeom(style: MarkerStyle, width: number, len: number, standing: number) {
  switch (style) {
    case "dauphine":
      return dauphineGeom(width, len, standing);
    case "infinity":
      return infinityGeom(width, len, standing);
    case "curve":
      return stadiumGeom(width, len, standing);
    case "baton":
    case "slim":
      return batonGeom(width, len, standing);
  }
}

export function createDial(markers: MarkerStyle = "curve", faceStyle: FaceStyle = "n40"): THREE.Group {
  const root = new THREE.Group();
  root.name = "dial";

  const map = creamTexture();
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f1e6,
    map: map ?? undefined,
    metalness: 0.03,
    roughness: 0.5,
  });
  const wellMat = new THREE.MeshPhysicalMaterial({
    color: 0xeee4d4,
    metalness: 0.03,
    roughness: 0.58,
  });

  const shape = new THREE.Shape();
  shape.absarc(0, 0, DIAL_R, 0, Math.PI * 2, false);
  const pipe = new THREE.Path();
  pipe.absarc(0, 0, 0.82, 0, Math.PI * 2, true);
  shape.holes.push(pipe);
  const sub = new THREE.Path();
  sub.absarc(fourth.x, fourth.y, SUB_R - 0.08, 0, Math.PI * 2, true);
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

  const well = new THREE.Mesh(new THREE.CylinderGeometry(SUB_R - 0.12, SUB_R - 0.12, 0.16, 48), wellMat);
  well.rotation.x = Math.PI / 2;
  well.position.set(fourth.x, fourth.y, DIAL_Z + 0.08);
  well.name = "seconds_well";
  root.add(well);

  const rehaut = new THREE.Mesh(
    new THREE.CylinderGeometry(DIAL_R + 0.08, DIAL_R - 0.15, 0.36, 64, 1, true),
    steelAccent(),
  );
  rehaut.material.side = THREE.DoubleSide;
  rehaut.rotation.x = Math.PI / 2;
  rehaut.position.z = DIAL_SURFACE + 0.06;
  rehaut.name = "rehaut";
  root.add(rehaut);

  const applied = steelAccent();
  const facet = steelPolish();
  const withFacet = markers === "baton" || markers === "slim" || markers === "curve";
  for (let k = 0; k < 12; k++) {
    if (k === 6) continue;
    const worldX = Math.sin((k * Math.PI) / 6);
    const worldY = Math.cos((k * Math.PI) / 6);
    const specX = -worldX;
    const specY = -worldY;
    const isTwelve = k === 0;
    const { len, width, standing } = indexSize(markers, isTwelve);
    const midR = DIAL_R - 0.88 - len / 2;
    const baton = new THREE.Mesh(indexGeom(markers, width, len, standing), applied);
    baton.position.set(specX * midR, specY * midR, DIAL_SURFACE + standing / 2);
    baton.rotation.z = Math.atan2(specX, specY);
    baton.name = `index_${k === 0 ? 12 : k}`;
    const sit = new THREE.Mesh(
      markers === "curve"
        ? stadiumGeom(width * 1.14, len * 1.1, 0.02)
        : indexGeom(markers, width * 1.12, len * 1.08, 0.02),
      sitMat(0.17),
    );
    sit.position.z = -standing / 2 + 0.012;
    sit.name = `${baton.name}_sit`;
    baton.add(sit);
    if (withFacet) {
      const polish =
        markers === "curve"
          ? new THREE.Mesh(stadiumGeom(width * 0.4, len * 0.64, 0.03), facet)
          : new THREE.Mesh(
              new THREE.BoxGeometry(width * (markers === "slim" ? 0.42 : 0.5), len * 0.68, 0.022),
              facet,
            );
      polish.position.z = standing / 2;
      polish.name = `${baton.name}_facet`;
      baton.add(polish);
    }
    root.add(baton);
  }

  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, SUB_R - 0.12, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, SUB_R - 0.38, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);
  const chapter = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ringShape, { depth: 0.12, bevelEnabled: false, curveSegments: 48 }),
    roseGold(),
  );
  chapter.position.set(fourth.x, fourth.y, DIAL_Z + 0.16);
  chapter.name = "seconds_subdial_ring";
  root.add(chapter);

  const tickMat = ink();
  const ringInner = SUB_R - 0.4;
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30;
    const sx = Math.sin(a);
    const sy = Math.cos(a);
    const five = i % 5 === 0;
    const len = five ? 0.36 : 0.18;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(five ? 0.05 : 0.028, len, 0.035), tickMat);
    const r = ringInner - len / 2;
    tick.position.set(fourth.x + sx * r, fourth.y + sy * r, DIAL_Z + 0.22);
    tick.rotation.z = Math.atan2(sx, sy);
    tick.name = `seconds_tick_${i}`;
    root.add(tick);
  }

  const label =
    faceStyle === "nocturne"
      ? wordmark("Nocturne", 6.6)
      : faceStyle === "n40"
        ? wordmark("N.40", 5.6, "Nocturne")
        : null;
  if (label) {
    label.position.set(fourth.x, fourth.y + SUB_R + 1.42, DIAL_SURFACE + 0.02);
    label.rotation.z = Math.PI;
    root.add(label);
  }

  const cannonMat = steelAccent();
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.3, 20), cannonMat);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 0, DIAL_SURFACE + 0.12);
  cannon.name = "center_cannon";
  root.add(cannon);

  const subPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.28, 16), cannonMat);
  subPipe.rotation.x = Math.PI / 2;
  subPipe.position.set(fourth.x, fourth.y, DIAL_Z + 0.22);
  subPipe.name = "seconds_pipe";
  root.add(subPipe);

  root.scale.setScalar(MM_SCALE);
  return root;
}
