/**
 * Closed cream dial in spec millimetres.
 * Index 12 at spec −Y so +180° wrapper reads 12 at world +Y.
 * Small-seconds at the fourth arbor. Rose-gold only on that ring.
 */
import * as THREE from "three";
import { PART_AXES_MM } from "./plate";

export const MARKER_LANES = ["curve", "slim", "dauphine", "baton"] as const;
export type MarkerStyle = (typeof MARKER_LANES)[number];
const MM_SCALE = 0.001;
export const DIAL_Z = 3.52;
const DIAL_R = 15.7;
const SUB_R = 4.0;
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
  g.addColorStop(0, "#f6efe4");
  g.addColorStop(0.55, "#eadcc8");
  g.addColorStop(1, "#dcc9ae");
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

function subdialTrack() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#e8dccb";
  ctx.fillRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.458;
  const inner = outer - size * 0.062;
  ctx.strokeStyle = "rgba(62, 48, 36, 0.58)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 60; i++) {
    const five = i % 5 === 0;
    const a = (i * Math.PI) / 30 - Math.PI / 2;
    ctx.strokeStyle = five ? "rgba(52, 40, 30, 0.78)" : "rgba(72, 56, 42, 0.5)";
    ctx.lineWidth = five ? 2.6 : 1.25;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function steelAccent() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x5a564f,
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 0.08,
    clearcoatRoughness: 0.32,
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
    metalness: 0.58,
    roughness: 0.28,
    clearcoat: 0.1,
    clearcoatRoughness: 0.3,
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

export function createDial(markers: MarkerStyle = "curve"): THREE.Group {
  const root = new THREE.Group();
  root.name = "dial";

  const map = creamTexture();
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4ebe0,
    map: map ?? undefined,
    metalness: 0.03,
    roughness: 0.48,
  });
  const wellMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8dccb,
    metalness: 0.03,
    roughness: 0.55,
  });

  const shape = new THREE.Shape();
  shape.absarc(0, 0, DIAL_R, 0, Math.PI * 2, false);
  const pipe = new THREE.Path();
  pipe.absarc(0, 0, 0.52, 0, Math.PI * 2, true);
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

  const FIELD_R = 12.2;
  const padShape = new THREE.Shape();
  padShape.absarc(0, 0, FIELD_R, 0, Math.PI * 2, false);
  const padPipe = new THREE.Path();
  padPipe.absarc(0, 0, 0.52, 0, Math.PI * 2, true);
  padShape.holes.push(padPipe);
  const padWell = new THREE.Path();
  padWell.absarc(fourth.x, fourth.y, SUB_R + 0.18, 0, Math.PI * 2, true);
  padShape.holes.push(padWell);
  const padGeom = new THREE.ExtrudeGeometry(padShape, {
    depth: 0.07,
    bevelEnabled: false,
    curveSegments: 64,
    UVGenerator: DIAL_UV,
  });
  const pad = new THREE.Mesh(padGeom, faceMat);
  pad.position.z = DIAL_SURFACE;
  pad.name = "dial_field";
  root.add(pad);

  const wellDepth = 0.42;
  const track = subdialTrack();
  const wellFloor = new THREE.Mesh(
    new THREE.CircleGeometry(SUB_R - 0.14, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xe8dccb,
      map: track ?? undefined,
      metalness: 0.03,
      roughness: 0.46,
    }),
  );
  wellFloor.position.set(fourth.x, fourth.y, DIAL_SURFACE - wellDepth + 0.03);
  wellFloor.name = "seconds_well";
  const wellWall = new THREE.Mesh(
    new THREE.CylinderGeometry(SUB_R - 0.11, SUB_R - 0.11, wellDepth, 48, 1, true),
    wellMat,
  );
  wellWall.material.side = THREE.DoubleSide;
  wellWall.rotation.x = Math.PI / 2;
  wellWall.position.set(fourth.x, fourth.y, DIAL_SURFACE - wellDepth / 2);
  wellWall.name = "seconds_well_wall";
  root.add(wellFloor, wellWall);

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
    const midR = DIAL_R - 0.38 - len / 2;
    const baton = new THREE.Mesh(indexGeom(markers, width, len, standing), applied);
    baton.position.set(specX * midR, specY * midR, DIAL_SURFACE + standing / 2 + 0.04);
    baton.rotation.z = Math.atan2(specX, specY);
    baton.name = `index_${k === 0 ? 12 : k}`;
    if (withFacet) {
      const polish =
        markers === "curve"
          ? new THREE.Mesh(stadiumGeom(width * 0.72, len * 0.78, 0.022), facet)
          : new THREE.Mesh(
              new THREE.BoxGeometry(width * (markers === "slim" ? 0.62 : 0.68), len * 0.78, 0.022),
              facet,
            );
      polish.position.z = standing / 2;
      polish.name = `${baton.name}_facet`;
      baton.add(polish);
    }
    root.add(baton);
  }

  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, SUB_R + 0.06, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, SUB_R - 0.34, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);
  const chapter = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ringShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 80,
    }),
    roseGold(),
  );
  chapter.position.set(fourth.x, fourth.y, DIAL_SURFACE + 0.02);
  chapter.name = "seconds_subdial_ring";
  root.add(chapter);

  const cannonMat = steelAccent();
  const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 20), cannonMat);
  cannon.rotation.x = Math.PI / 2;
  cannon.position.set(0, 0, DIAL_SURFACE + 0.05);
  cannon.name = "center_cannon";
  root.add(cannon);

  const subPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.08, 16), cannonMat);
  subPipe.rotation.x = Math.PI / 2;
  subPipe.position.set(fourth.x, fourth.y, DIAL_SURFACE - wellDepth + 0.08);
  subPipe.name = "seconds_pipe";
  root.add(subPipe);

  root.scale.setScalar(MM_SCALE);
  return root;
}
