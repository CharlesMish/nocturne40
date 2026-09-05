/**
 * Dark espresso dress strap in spec millimetres, in lug-tilt space.
 * Local +Y is out along the horn. Spine lives in YZ (no Frenet twist).
 * Buckle only on spec +Y (product 6).
 */
import * as THREE from "three";
import { designStudy, executionFinish, seatingFinish, physicalFinish, physicalStudy, type DesignVariant } from "./design";

import { paddedLeather, fittedHardware } from "./leather";

const THICK = 1.58;
const W0 = 7.55;
const W1 = 6.45;
const CORNER = 0.24;
const FLAT_SEGS = 5;
const CORNER_SEGS = 6;

const BAR_Y = 3.14;
const BAR_Z = 0.02;
const BAR_R = 0.24;
const HT = THICK / 2;
const R_IN = BAR_R + 0.05;
/** Join plane between the X-tunnel terminal and the accepted body sweep. */
const JOIN_Y = BAR_Y + HT + 0.16;
const ARC_SEGS = 28;
const BODY_N = 56;

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function queryFlag(name: string) {
  return new URLSearchParams(location.search).get(name) === "1";
}

export const LEATHER_LANES = ["l0", "l1", "l2"] as const;
export type LeatherLane = (typeof LEATHER_LANES)[number];

export function leatherLane(): LeatherLane {
  const v = new URLSearchParams(location.search).get("leather");
  if (v === "l0" || v === "0") return "l0";
  if (v === "l2" || v === "2") return "l2";
  return "l1";
}

/** Original recovered body spine. Tail from y=4.55 is sampled as-is. */
function spinePoints() {
  return [
    new THREE.Vector3(0, 3.14, 0.02),
    new THREE.Vector3(0, 4.55, 0.02),
    new THREE.Vector3(0, 5.7, -0.14),
    new THREE.Vector3(0, 6.8, -0.22),
    new THREE.Vector3(0, 11.2, -1.35),
    new THREE.Vector3(0, 16.4, -4.2),
    new THREE.Vector3(0, 20.8, -8.8),
    new THREE.Vector3(0, 23.8, -14.6),
    new THREE.Vector3(0, 25.2, -21.2),
    new THREE.Vector3(0, 25.6, -24.0),
  ];
}

function widthAt(y: number, t: number, design: DesignVariant = "baseline") {
  const study = designStudy(design);
  if (study) return THREE.MathUtils.lerp(study.strapWidth, study.strapTail, t);
  const wRaw = (W0 * (1 - t) + W1 * t) * 2;
  const well = 11.1;
  if (y < 6.8) {
    const u = Math.max(0, Math.min(1, (y - 3.14) / 3.66));
    return Math.min(wRaw, 10.4 + (well - 10.4) * u);
  }
  if (y < 8.6) {
    const u = (y - 6.8) / 1.8;
    const s = u * u * (3 - 2 * u);
    return well * (1 - s) + wRaw * s;
  }
  return wRaw;
}

function leatherMaps() {
  const n = 512;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { map: null as THREE.CanvasTexture | null, roughness: null as THREE.CanvasTexture | null };
  ctx.fillStyle = "#d8cfc8";
  ctx.fillRect(0, 0, n, n);
  for (let x = 0; x < n; x++) {
    const fiber = 0.035 + hash(x) * 0.04;
    ctx.fillStyle = `rgba(72, 46, 36, ${fiber})`;
    ctx.fillRect(x, 0, 1, n);
  }
  for (let i = 0; i < 420; i++) {
    const x = hash(i * 3.1) * n;
    const y = hash(i * 5.7) * n;
    ctx.fillStyle = `rgba(58, 36, 28, ${0.03 + hash(i) * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 0.6 + hash(i + 2) * 0.9, 1.4 + hash(i + 4) * 2.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.15, 2.8);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = n;
  rCanvas.height = n;
  const rctx = rCanvas.getContext("2d");
  if (!rctx) return { map, roughness: null as THREE.CanvasTexture | null };
  rctx.fillStyle = "#b8b8b8";
  rctx.fillRect(0, 0, n, n);
  for (let x = 0; x < n; x += 2) {
    const g = 150 + Math.floor(hash(x + 9) * 55);
    rctx.fillStyle = `rgb(${g},${g},${g})`;
    rctx.fillRect(x, 0, 1, n);
  }
  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(1.15, 2.8);
  roughness.colorSpace = THREE.NoColorSpace;
  return { map, roughness };
}

function leatherMapsRefined(stitch: boolean, subtle = false) {
  const n = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { map: null as THREE.CanvasTexture | null, roughness: null as THREE.CanvasTexture | null };
  ctx.fillStyle = "#e6ddd6";
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 22; i++) {
    const x = hash(i * 1.7) * n;
    const y = hash(i * 2.9) * n;
    if (subtle) {
      const radius = 100 + hash(i + 2) * 150;
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
      cloud.addColorStop(0, `rgba(42, 24, 18, ${0.012 + hash(i) * 0.016})`);
      cloud.addColorStop(1, "rgba(42, 24, 18, 0)");
      ctx.fillStyle = cloud;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      continue;
    }
    ctx.fillStyle = `rgba(42, 24, 18, ${0.016 + hash(i) * 0.028})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 90 + hash(i + 2) * 140, 55 + hash(i + 4) * 90, hash(i + 6) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < (subtle ? 0 : 9); i++) {
    const x = ((i + 0.35) / 9) * n + (hash(i + 11) - 0.5) * 18;
    ctx.fillStyle = `rgba(48, 30, 24, ${0.012 + hash(i + 13) * 0.018})`;
    ctx.fillRect(x, 0, 3 + hash(i + 15) * 5, n);
  }
  if (subtle) for (let i = 0; i < 2400; i++) {
    ctx.fillStyle = i % 2 ? "rgba(42, 24, 18, 0.035)" : "rgba(255, 246, 232, 0.05)";
    ctx.beginPath();
    ctx.ellipse(hash(i + 101) * n, hash(i + 207) * n, 0.4 + hash(i) * 0.7, 0.6 + hash(i + 4), hash(i + 9) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const flex = ctx.createLinearGradient(0, 0, 0, n);
  flex.addColorStop(0.08, "rgba(255, 244, 232, 0)");
  flex.addColorStop(0.16, "rgba(255, 244, 232, 0.035)");
  flex.addColorStop(0.24, "rgba(255, 244, 232, 0)");
  flex.addColorStop(0.52, "rgba(255, 244, 232, 0)");
  flex.addColorStop(0.62, "rgba(255, 244, 232, 0.028)");
  flex.addColorStop(0.74, "rgba(255, 244, 232, 0)");
  ctx.fillStyle = flex;
  ctx.fillRect(0, 0, n, n);
  const edge = ctx.createLinearGradient(0, 0, n, 0);
  edge.addColorStop(0, "rgba(18, 10, 8, 0.42)");
  edge.addColorStop(0.04, "rgba(18, 10, 8, 0.16)");
  edge.addColorStop(0.09, "rgba(18, 10, 8, 0)");
  edge.addColorStop(0.91, "rgba(18, 10, 8, 0)");
  edge.addColorStop(0.96, "rgba(18, 10, 8, 0.16)");
  edge.addColorStop(1, "rgba(18, 10, 8, 0.42)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, n, n);
  if (stitch) {
    ctx.strokeStyle = "rgba(88, 62, 50, 0.42)";
    ctx.lineWidth = 1.15;
    ctx.lineCap = "round";
    const dash = 6;
    const gap = 5;
    for (const u of [0.07, 0.93]) {
      const x = u * n;
      for (let y = 10; y < n - 10; y += dash + gap) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + dash);
        ctx.stroke();
      }
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = n;
  rCanvas.height = n;
  const rctx = rCanvas.getContext("2d");
  if (!rctx) return { map, roughness: null as THREE.CanvasTexture | null };
  rctx.fillStyle = "#9a9a9a";
  rctx.fillRect(0, 0, n, n);
  const redge = rctx.createLinearGradient(0, 0, n, 0);
  redge.addColorStop(0, "#6e6e6e");
  redge.addColorStop(0.08, "#9a9a9a");
  redge.addColorStop(0.92, "#9a9a9a");
  redge.addColorStop(1, "#6e6e6e");
  rctx.fillStyle = redge;
  rctx.fillRect(0, 0, n, n);
  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.ClampToEdgeWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.colorSpace = THREE.NoColorSpace;
  roughness.anisotropy = 4;
  return { map, roughness };
}

/** A 4 mm tile: relief and roughness share pores; color carries no baked light. */
function calfMaterial(color:number,wire:boolean){
  const n=512, canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=n;return c;});
  const [albedo,height,rough]=canvases.map(c=>c.getContext('2d')!);
  albedo.fillStyle='#e6ddd6';albedo.fillRect(0,0,n,n);height.fillStyle='#808080';height.fillRect(0,0,n,n);rough.fillStyle='#e0e0e0';rough.fillRect(0,0,n,n);
  for(let i=0;i<1500;i++){
    const x=hash(i+12)*n,y=hash(i+312)*n,r=1+hash(i+62)*2;
    for(const [ctx,c] of [[albedo,'rgba(54,35,25,.025)'],[height,'rgba(30,30,30,.22)'],[rough,'rgba(100,100,100,.10)']] as const){
      ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,r*.65,r,hash(i+82)*Math.PI,0,Math.PI*2);ctx.fill();
    }
  }
  const maps=canvases.map((c,i)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=8;return t;});
  return new THREE.MeshPhysicalMaterial({color,map:wire?undefined:maps[0],bumpMap:wire?undefined:maps[1],bumpScale:.000006,roughnessMap:wire?undefined:maps[2],roughness:.82,metalness:0,sheen:.10,sheenColor:new THREE.Color(color),sheenRoughness:.85,clearcoat:0,specularIntensity:.24,wireframe:wire});
}

export function leatherMat(design: DesignVariant = "baseline") {
  const wire = queryFlag("wire");
  const study = designStudy(design);
  if (study && seatingFinish()) return calfMaterial(study.leatherColor,wire);
  if (study) {
    const { map, roughness } = leatherMapsRefined(design === "sculptural", true);
    return new THREE.MeshPhysicalMaterial({
      color: study.leatherColor, map: wire ? undefined : map ?? undefined,
      roughnessMap: wire ? undefined : roughness ?? undefined,
      roughness: design === "sculptural" ? 0.72 : 0.82,
      metalness: 0, sheen: 0.28, sheenColor: new THREE.Color(study.leatherColor),
      sheenRoughness: 0.8, clearcoat: 0.04, clearcoatRoughness: 0.6,
      specularIntensity: 0.24, wireframe: wire,
    });
  }
  const lane = leatherLane();
  if (lane === "l1" || lane === "l2") {
    const { map, roughness } = leatherMapsRefined(lane === "l2");
    return new THREE.MeshPhysicalMaterial({
      color: 0x6a483c,
      map: wire ? undefined : map ?? undefined,
      roughnessMap: wire ? undefined : roughness ?? undefined,
      roughness: 0.56,
      metalness: 0.02,
      sheen: 0.36,
      sheenColor: new THREE.Color(0x5c3c30),
      sheenRoughness: 0.7,
      clearcoat: 0.05,
      clearcoatRoughness: 0.52,
      specularIntensity: 0.16,
      side: THREE.FrontSide,
      wireframe: wire,
    });
  }
  const { map, roughness } = leatherMaps();
  return new THREE.MeshPhysicalMaterial({
    color: 0x6a483c,
    map: wire ? undefined : map ?? undefined,
    roughnessMap: wire ? undefined : roughness ?? undefined,
    roughness: 0.7,
    metalness: 0.02,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x6e4c3c),
    sheenRoughness: 0.84,
    specularIntensity: 0.14,
    side: THREE.FrontSide,
    wireframe: wire,
  });
}

export function strapSteel(live = false) {
  return new THREE.MeshPhysicalMaterial({
    color: live ? 0x6e7278 : 0xb7b8bc,
    metalness: 0.96,
    roughness: live ? 0.34 : 0.38,
    clearcoat: live ? 0.06 : 0,
    specularIntensity: 1,
  });
}

type Prof = { x: number; y: number; nx: number; ny: number };
type Frame = { p: THREE.Vector3; T: THREE.Vector3; ht: number };

function roundedRectProfile(hw: number, ht: number, corner: number): Prof[] {
  const r = Math.min(corner, hw * 0.4, ht * 0.72);
  const out: Prof[] = [];
  const push = (x: number, y: number, nx: number, ny: number) => {
    out.push({ x, y, nx, ny });
  };

  for (let i = 0; i <= FLAT_SEGS; i++) {
    const t = i / FLAT_SEGS;
    push(-hw + r + 2 * (hw - r) * t, -ht, 0, -1);
  }
  {
    const cx = hw - r;
    const cy = -ht + r;
    for (let i = 1; i <= CORNER_SEGS; i++) {
      const a = -Math.PI / 2 + (Math.PI / 2) * (i / CORNER_SEGS);
      push(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a));
    }
  }
  for (let i = 1; i < FLAT_SEGS; i++) {
    const t = i / FLAT_SEGS;
    push(hw, -ht + r + 2 * (ht - r) * t, 1, 0);
  }
  {
    const cx = hw - r;
    const cy = ht - r;
    for (let i = 1; i <= CORNER_SEGS; i++) {
      const a = (Math.PI / 2) * (i / CORNER_SEGS);
      push(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a));
    }
  }
  for (let i = 1; i <= FLAT_SEGS; i++) {
    const t = i / FLAT_SEGS;
    push(hw - r - 2 * (hw - r) * t, ht, 0, 1);
  }
  {
    const cx = -hw + r;
    const cy = ht - r;
    for (let i = 1; i <= CORNER_SEGS; i++) {
      const a = Math.PI / 2 + (Math.PI / 2) * (i / CORNER_SEGS);
      push(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a));
    }
  }
  for (let i = 1; i < FLAT_SEGS; i++) {
    const t = i / FLAT_SEGS;
    push(-hw, ht - r - 2 * (ht - r) * t, -1, 0);
  }
  {
    const cx = -hw + r;
    const cy = -ht + r;
    for (let i = 1; i < CORNER_SEGS; i++) {
      const a = Math.PI + (Math.PI / 2) * (i / CORNER_SEGS);
      push(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a));
    }
  }
  return out;
}

function nearestT(curve: THREE.CatmullRomCurve3, target: THREE.Vector3) {
  const q = new THREE.Vector3();
  let bestT = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 500; i++) {
    const t = i / 500;
    curve.getPointAt(t, q);
    const d = q.distanceToSquared(target);
    if (d < bestD) {
      bestD = d;
      bestT = t;
    }
  }
  return bestT;
}

function pushFrame(frames: Frame[], p: THREE.Vector3, T: THREE.Vector3, ht: number) {
  const t = T.clone();
  t.x = 0;
  if (t.lengthSq() < 1e-14) return;
  t.normalize();
  const last = frames[frames.length - 1];
  if (last && last.p.distanceToSquared(p) < 1e-10) return;
  frames.push({ p: p.clone(), T: t, ht });
}

function buildFrames(design: DesignVariant = "baseline"): Frame[] {
  const study = designStudy(design);
  const frames: Frame[] = [];
  const bodyCurve = new THREE.CatmullRomCurve3(spinePoints(), false, "centripetal");
  const tJoin = nearestT(bodyCurve, new THREE.Vector3(0, JOIN_Y, BAR_Z));
  pushFrame(frames, new THREE.Vector3(0, JOIN_Y, BAR_Z), new THREE.Vector3(0, 1, 0), HT);
  for (let i = 1; i < BODY_N; i++) {
    const t = tJoin + (1 - tJoin) * (i / (BODY_N - 1));
    const p = new THREE.Vector3();
    const T = new THREE.Vector3();
    bodyCurve.getPointAt(t, p);
    bodyCurve.getTangentAt(t, T);
    const progress = i / (BODY_N - 1);
    pushFrame(frames, p, T, HT + (study?.padding ?? 0) * Math.sin(Math.PI * progress));
  }
  return frames;
}

/**
 * Stadium in YZ (rounded strap end) with a circular hole along X for the bar.
 * This is the union of the old cylinder+slab, as one solid: no C-slot toward the body.
 */
function terminalGeom(hw: number) {
  const shape = new THREE.Shape();
  shape.moveTo(JOIN_Y, BAR_Z + HT);
  shape.lineTo(BAR_Y, BAR_Z + HT);
  for (let i = 1; i <= ARC_SEGS; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / ARC_SEGS;
    shape.lineTo(BAR_Y + HT * Math.cos(a), BAR_Z + HT * Math.sin(a));
  }
  shape.lineTo(JOIN_Y, BAR_Z - HT);
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(BAR_Y, BAR_Z, R_IN, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const width = hw * 2;
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: false,
    curveSegments: 20,
    steps: 1,
  });
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getX(i);
    const z = pos.getY(i);
    const x = pos.getZ(i) - width / 2;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function sweepBand(mat: THREE.Material, frames: Frame[], capStart = true, design: DesignVariant = "baseline") {
  const nLat = frames.length;
  const nProf = roundedRectProfile(1, 1, CORNER).length;
  const sideCount = nLat * nProf;
  const positions = new Float32Array((sideCount + nProf * 2) * 3);
  const normals = new Float32Array((sideCount + nProf * 2) * 3);
  const uvs = new Float32Array((sideCount + nProf * 2) * 2);
  const index: number[] = [];

  const N = new THREE.Vector3(1, 0, 0);
  const G = new THREE.Vector3();
  const nor = new THREE.Vector3();
  const pos = new THREE.Vector3();

  const setVert = (vi: number, p: THREE.Vector3, n: THREE.Vector3, u: number, v: number) => {
    positions[vi * 3] = p.x;
    positions[vi * 3 + 1] = p.y;
    positions[vi * 3 + 2] = p.z;
    normals[vi * 3] = n.x;
    normals[vi * 3 + 1] = n.y;
    normals[vi * 3 + 2] = n.z;
    uvs[vi * 2] = u;
    uvs[vi * 2 + 1] = v;
  };

  for (let i = 0; i < nLat; i++) {
    const { p: P, T, ht } = frames[i];
    G.crossVectors(N, T).normalize();
    const t = i / (nLat - 1);
    const hw = widthAt(P.y, t, design) / 2;
    const prof = roundedRectProfile(hw, ht, CORNER);
    for (let j = 0; j < nProf; j++) {
      const pr = prof[j];
      pos.set(
        P.x + N.x * pr.x + G.x * pr.y,
        P.y + N.y * pr.x + G.y * pr.y,
        P.z + N.z * pr.x + G.z * pr.y,
      );
      nor.set(
        N.x * pr.nx + G.x * pr.ny,
        N.y * pr.nx + G.y * pr.ny,
        N.z * pr.nx + G.z * pr.ny,
      ).normalize();
      setVert(i * nProf + j, pos, nor, (pr.x / hw) * 0.5 + 0.5, t);
    }
  }

  for (let i = 0; i < nLat - 1; i++) {
    for (let j = 0; j < nProf; j++) {
      const j2 = (j + 1) % nProf;
      const a = i * nProf + j;
      const b = i * nProf + j2;
      const c = (i + 1) * nProf + j;
      const d = (i + 1) * nProf + j2;
      index.push(a, c, b);
      index.push(b, c, d);
    }
  }

  const startBase = sideCount;
  const endBase = sideCount + nProf;
  const f0 = frames[0];
  const f1 = frames[nLat - 1];
  G.crossVectors(N, f0.T).normalize();
  const startHw = widthAt(f0.p.y, 0, design) / 2;
  const startProf = roundedRectProfile(startHw, f0.ht, CORNER);
  const nStart = f0.T.clone().negate();
  for (let j = 0; j < nProf; j++) {
    const pr = startProf[j];
    pos.set(
      f0.p.x + N.x * pr.x + G.x * pr.y,
      f0.p.y + N.y * pr.x + G.y * pr.y,
      f0.p.z + N.z * pr.x + G.z * pr.y,
    );
    setVert(startBase + j, pos, nStart, (pr.x / startHw) * 0.5 + 0.5, 0);
  }
  G.crossVectors(N, f1.T).normalize();
  const endHw = widthAt(f1.p.y, 1, design) / 2;
  const endProf = roundedRectProfile(endHw, f1.ht, CORNER);
  for (let j = 0; j < nProf; j++) {
    const pr = endProf[j];
    pos.set(
      f1.p.x + N.x * pr.x + G.x * pr.y,
      f1.p.y + N.y * pr.x + G.y * pr.y,
      f1.p.z + N.z * pr.x + G.z * pr.y,
    );
    setVert(endBase + j, pos, f1.T, (pr.x / endHw) * 0.5 + 0.5, 1);
  }
  for (let j = 1; j < nProf - 1; j++) {
    if (capStart) index.push(startBase, startBase + j, startBase + j + 1);
    index.push(endBase, endBase + j + 1, endBase + j);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(index);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = "strap_band";
  return mesh;
}

function loopDebug(frames: Frame[]) {
  const g = new THREE.Group();
  g.name = "strap_loop_debug";
  const spine: number[] = [];
  for (const f of frames) spine.push(f.p.x, f.p.y, f.p.z);
  const spineGeom = new THREE.BufferGeometry();
  spineGeom.setAttribute("position", new THREE.Float32BufferAttribute(spine, 3));
  g.add(new THREE.Line(spineGeom, new THREE.LineBasicMaterial({ color: 0xffcc66 })));

  const stad: number[] = [];
  stad.push(0, JOIN_Y, BAR_Z + HT, 0, BAR_Y, BAR_Z + HT);
  for (let i = 0; i <= ARC_SEGS; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / ARC_SEGS;
    stad.push(0, BAR_Y + HT * Math.cos(a), BAR_Z + HT * Math.sin(a));
  }
  stad.push(0, JOIN_Y, BAR_Z - HT, 0, JOIN_Y, BAR_Z + HT);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute(stad, 3));
  g.add(new THREE.Line(sg, new THREE.LineBasicMaterial({ color: 0x66ddee })));

  const addCircle = (r: number, color: number) => {
    const pts: number[] = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      pts.push(0, BAR_Y + r * Math.cos(a), BAR_Z + r * Math.sin(a));
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.Line(bg, new THREE.LineBasicMaterial({ color })));
  };
  addCircle(BAR_R, 0x8899aa);
  addCircle(R_IN, 0x446688);
  addCircle(HT, 0xaa8866);

  const audit = {
    frames: frames.length,
    joinY: JOIN_Y,
    rIn: R_IN,
    ht: HT,
    samples: frames
      .filter((_, i) => i % 8 === 0 || i === frames.length - 1)
      .map((f) => ({ y: +f.p.y.toFixed(3), z: +f.p.z.toFixed(3), ht: +f.ht.toFixed(3) })),
  };
  (globalThis as unknown as { __strapLoop: typeof audit }).__strapLoop = audit;
  console.info(`[strap loop] joinY=${JOIN_Y.toFixed(3)} rIn=${R_IN.toFixed(3)} ht=${HT.toFixed(3)} bodyFrames=${frames.length}`);
  return g;
}

function keeper(hide: THREE.Material, y: number, z: number, tilt: number) {
  const shape = new THREE.Shape();
  const hw = W0 + 0.5;
  const ht = THICK / 2 + 0.32;
  const r = 0.16;
  shape.moveTo(-hw + r, -ht);
  shape.lineTo(hw - r, -ht);
  shape.quadraticCurveTo(hw, -ht, hw, -ht + r);
  shape.lineTo(hw, ht - r);
  shape.quadraticCurveTo(hw, ht, hw - r, ht);
  shape.lineTo(-hw + r, ht);
  shape.quadraticCurveTo(-hw, ht, -hw, ht - r);
  shape.lineTo(-hw, -ht + r);
  shape.quadraticCurveTo(-hw, -ht, -hw + r, -ht);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-W0 + 0.12, -THICK / 2 - 0.02);
  hole.lineTo(W0 - 0.12, -THICK / 2 - 0.02);
  hole.lineTo(W0 - 0.12, THICK / 2 + 0.02);
  hole.lineTo(-W0 + 0.12, THICK / 2 + 0.02);
  hole.closePath();
  shape.holes.push(hole);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 3.4,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 1,
  });
  geom.rotateX(Math.PI / 2);
  geom.translate(0, 0, -1.7);
  const mesh = new THREE.Mesh(geom, hide);
  mesh.position.set(0, y, z);
  mesh.rotation.x = tilt;
  mesh.name = "strap_keeper";
  return mesh;
}

function springBar(bar: THREE.Material, design: DesignVariant = "baseline") {
  const geom = new THREE.CylinderGeometry(0.24, 0.24, designStudy(design) ? 19.2 : 15.2, 12);
  geom.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, bar);
  mesh.position.set(0, BAR_Y, BAR_Z);
  mesh.name = "springbar";
  return mesh;
}

function buckle(bar: THREE.Material) {
  const g = new THREE.Group();
  g.name = "buckle";
  g.position.set(0, 24.6, -18.4);
  g.rotation.x = 1.05;

  const frameShape = new THREE.Shape();
  frameShape.moveTo(-3.4, -2.15);
  frameShape.lineTo(3.4, -2.15);
  frameShape.lineTo(3.4, 2.15);
  frameShape.lineTo(-3.4, 2.15);
  frameShape.closePath();
  const inner = new THREE.Path();
  inner.moveTo(-2.55, -1.35);
  inner.lineTo(2.55, -1.35);
  inner.lineTo(2.55, 1.35);
  inner.lineTo(-2.55, 1.35);
  inner.closePath();
  frameShape.holes.push(inner);
  const frame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frameShape, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 1 }),
    bar,
  );
  frame.position.z = -0.28;

  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.4, 8), bar);
  pin.rotation.z = Math.PI / 2;

  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.4, 0.18), bar);
  tongue.position.set(0, 0.4, 0.12);

  g.add(frame, pin, tongue);
  return g;
}

export function addStrapToLug(tilt: THREE.Group, withBuckle: boolean, liveSteel = false, design: DesignVariant = "baseline") {
  const study = designStudy(design);
  const hide = leatherMat(design);
  const bar = strapSteel(liveSteel);
  if (physicalStudy(design)) {
    const refined=executionFinish();
    const {root, frames} = paddedLeather(hide, withBuckle, refined, physicalFinish(), seatingFinish());
    if (refined) {
      // Align the attachment with the horn section, rather than its upper edge.
      const attachment=new THREE.Group();attachment.name='strap_attachment';attachment.position.z=-.2;
      const spring=new THREE.Group();spring.name='springbar';spring.position.set(0,BAR_Y,BAR_Z);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,17.6,64),bar);body.rotation.z=Math.PI/2;spring.add(body);
      for(const side of [-1,1]) {
        const tip=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.8,48),bar);
        tip.rotation.z=Math.PI/2;tip.position.x=side*9.2;spring.add(tip);
      }
      attachment.add(root,spring);
      if(withBuckle)attachment.add(fittedHardware(bar,hide,frames,true));
      tilt.add(attachment);
    } else {
      tilt.add(root, springBar(bar, design));
      if (withBuckle) tilt.add(fittedHardware(bar, hide, frames));
    }
    return;
  }
  const frames = buildFrames(design);
  const hw = widthAt(JOIN_Y, 0, design) / 2;
  const terminal = new THREE.Mesh(terminalGeom(hw), hide);
  terminal.name = "strap_terminal";
  tilt.add(terminal);
  tilt.add(sweepBand(hide, frames, false, design));
  if (queryFlag("loopdebug")) tilt.add(loopDebug(frames));
  if (withBuckle) {
    const loop = keeper(hide, 20.2, -8.2, 0.55);
    if (study) loop.scale.x = study.strapWidth / (W0 * 2);
    tilt.add(loop);
  }
  tilt.add(springBar(bar, design));
  if (withBuckle) {
    const clasp = buckle(bar);
    if (study) clasp.scale.x = study.strapTail / (W1 * 2);
    tilt.add(clasp);
  }
}
