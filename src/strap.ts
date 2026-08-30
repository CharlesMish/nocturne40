/**
 * Dark leather strap in spec millimetres, in lug-tilt space.
 * Local +Y is out along the horn. Spine lives in YZ (no Frenet twist).
 * Buckle only on spec +Y (product 6).
 */
import * as THREE from "three";

const THICK = 1.32;
const W0 = 7.55;
const W1 = 6.55;
const SEGMENTS = 18;

function spinePoints() {
  return [
    new THREE.Vector3(0, 3.05, 0.05),
    new THREE.Vector3(0, 7.2, -0.25),
    new THREE.Vector3(0, 12.4, -1.6),
    new THREE.Vector3(0, 17.6, -4.8),
    new THREE.Vector3(0, 21.8, -9.6),
    new THREE.Vector3(0, 24.4, -15.8),
    new THREE.Vector3(0, 25.4, -22.5),
  ];
}

function leatherMaps() {
  const n = 512;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { map: null as THREE.CanvasTexture | null };
  ctx.fillStyle = "#7a5340";
  ctx.fillRect(0, 0, n, n);
  for (let y = 0; y < n; y++) {
    ctx.fillStyle = `rgba(20, 10, 6, ${0.04 + (y % 7) * 0.008})`;
    ctx.fillRect(0, y, n, 1);
  }
  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * n;
    const y = Math.random() * n;
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 0.6 + Math.random(), 0.4 + Math.random() * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(90, 70, 50, 0.35)";
  ctx.lineWidth = 1.2;
  for (const x of [70, n - 70]) {
    ctx.setLineDash([3, 5.5]);
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, n - 8);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 3.2);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map };
}

export function leatherMat() {
  const { map } = leatherMaps();
  return new THREE.MeshStandardMaterial({
    color: 0x7a5340,
    map: map ?? undefined,
    roughness: 0.88,
    metalness: 0.02,
  });
}

export function strapSteel() {
  return new THREE.MeshStandardMaterial({
    color: 0xc5c6ca,
    metalness: 0.9,
    roughness: 0.22,
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
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, len * 1.08, THICK), hide);
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
  const geom = new THREE.CylinderGeometry(0.38, 0.38, 15.6, 12);
  geom.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, bar);
  mesh.position.set(0, 3.15, 0.02);
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

export function addStrapToLug(tilt: THREE.Group, withBuckle: boolean) {
  const hide = leatherMat();
  const bar = strapSteel();
  tilt.add(band(hide));
  tilt.add(keeper(hide, 9.4, -0.7, 0.12));
  if (withBuckle) tilt.add(keeper(hide, 20.2, -8.2, 0.55));
  tilt.add(springBar(bar));
  if (withBuckle) tilt.add(buckle(bar));
}
