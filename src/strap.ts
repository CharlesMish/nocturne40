/**
 * Dark leather strap in spec millimetres, in lug-tilt space.
 * Local +Y is out along the horn. Spine lives in YZ (no Frenet twist).
 * Buckle only on spec +Y (product 6).
 */
import * as THREE from "three";

const THICK = 1.28;
const W0 = 7.55;
const W1 = 6.45;
const SEGMENTS = 28;

function spinePoints() {
  return [
    new THREE.Vector3(0, 2.55, 0.02),
    new THREE.Vector3(0, 6.4, -0.18),
    new THREE.Vector3(0, 11.2, -1.35),
    new THREE.Vector3(0, 16.4, -4.2),
    new THREE.Vector3(0, 20.8, -8.8),
    new THREE.Vector3(0, 23.8, -14.6),
    new THREE.Vector3(0, 25.2, -21.2),
    new THREE.Vector3(0, 25.6, -24.0),
  ];
}

function leatherMaps() {
  const n = 512;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { map: null as THREE.CanvasTexture | null, roughness: null as THREE.CanvasTexture | null };
  ctx.fillStyle = "#5c3c32";
  ctx.fillRect(0, 0, n, n);
  for (let y = 0; y < n; y++) {
    ctx.fillStyle = `rgba(92, 58, 44, ${0.06 + (y % 11) * 0.01})`;
    ctx.fillRect(0, y, n, 1);
  }
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * n;
    const y = Math.random() * n;
    ctx.fillStyle = `rgba(${62 + Math.random() * 36}, ${36 + Math.random() * 20}, ${26 + Math.random() * 14}, ${0.07 + Math.random() * 0.14})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 0.8 + Math.random() * 1.2, 0.4 + Math.random() * 1.1, Math.random() * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 3.2);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const rCanvas = document.createElement("canvas");
  rCanvas.width = n;
  rCanvas.height = n;
  const rctx = rCanvas.getContext("2d");
  if (!rctx) return { map, roughness: null as THREE.CanvasTexture | null };
  rctx.fillStyle = "#c8c8c8";
  rctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * n;
    const y = Math.random() * n;
    const g = 140 + Math.floor(Math.random() * 90);
    rctx.fillStyle = `rgb(${g},${g},${g})`;
    rctx.beginPath();
    rctx.ellipse(x, y, 1.2 + Math.random() * 2, 0.6 + Math.random(), 0, 0, Math.PI * 2);
    rctx.fill();
  }
  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(1, 3.2);
  roughness.colorSpace = THREE.NoColorSpace;
  return { map, roughness };
}

export function leatherMat() {
  const { map, roughness } = leatherMaps();
  return new THREE.MeshPhysicalMaterial({
    color: 0x6a4538,
    map: map ?? undefined,
    roughnessMap: roughness ?? undefined,
    roughness: 0.74,
    metalness: 0.02,
    sheen: 0.28,
    sheenColor: new THREE.Color(0x8a624e),
    sheenRoughness: 0.78,
    specularIntensity: 0.18,
  });
}

export function strapSteel() {
  return new THREE.MeshStandardMaterial({
    color: 0xb7b8bc,
    metalness: 0.9,
    roughness: 0.38,
  });
}

function band(hide: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(spinePoints());
  const group = new THREE.Group();
  group.name = "strap_band";
  const pts = curve.getSpacedPoints(SEGMENTS);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mid = a.clone().lerp(b, 0.5);
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const len = Math.hypot(dy, dz);
    const t = (i + 0.5) / (pts.length - 1);
    const w = (W0 * (1 - t) + W1 * t) * 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, len * 1.12, THICK), hide);
    mesh.position.copy(mid);
    mesh.rotation.x = Math.atan2(dz, dy);
    group.add(mesh);
  }
  return group;
}

function keeper(hide: THREE.Material, y: number, z: number, tilt: number) {
  const shape = new THREE.Shape();
  const hw = W0 + 0.55;
  const ht = THICK / 2 + 0.38;
  shape.moveTo(-hw, -ht);
  shape.lineTo(hw, -ht);
  shape.lineTo(hw, ht);
  shape.lineTo(-hw, ht);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-W0 + 0.05, -THICK / 2 - 0.04);
  hole.lineTo(W0 - 0.05, -THICK / 2 - 0.04);
  hole.lineTo(W0 - 0.05, THICK / 2 + 0.04);
  hole.lineTo(-W0 + 0.05, THICK / 2 + 0.04);
  hole.closePath();
  shape.holes.push(hole);
  const geom = new THREE.ExtrudeGeometry(shape, { depth: 3.6, bevelEnabled: false });
  geom.rotateX(Math.PI / 2);
  geom.translate(0, 0, -1.8);
  const mesh = new THREE.Mesh(geom, hide);
  mesh.position.set(0, y, z);
  mesh.rotation.x = tilt;
  mesh.name = "strap_keeper";
  return mesh;
}

function springBar(bar: THREE.Material) {
  const geom = new THREE.CylinderGeometry(0.36, 0.36, 15.2, 12);
  geom.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, bar);
  mesh.position.set(0, 3.12, 0.02);
  mesh.name = "springbar";
  return mesh;
}

function strapSeat(hide: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(W0 * 2 - 0.5, 2.35, THICK + 0.16), hide);
  mesh.position.set(0, 3.12, 0.03);
  mesh.name = "strap_seat";
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

export function addStrapToLug(tilt: THREE.Group, withBuckle: boolean) {
  const hide = leatherMat();
  const bar = strapSteel();
  tilt.add(band(hide));
  tilt.add(strapSeat(hide));
  tilt.add(keeper(hide, 9.4, -0.7, 0.12));
  if (withBuckle) tilt.add(keeper(hide, 20.2, -8.2, 0.55));
  tilt.add(springBar(bar));
  if (withBuckle) tilt.add(buckle(bar));
}
