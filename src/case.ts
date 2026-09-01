/**
 * B8 steel case in spec millimetres, then 0.001 scale.
 * Lugs on spec ±Y; crown at spec −X (3 o'clock after +180° Z).
 * Waisted mid + modest dome so S reads as a dress stack, not a puck.
 */
import * as THREE from "three";
import { addStrapToLug } from "./strap";

const MM_SCALE = 0.001;
const CASE_OD = 20;
const CASE_ID = 16.85;
const BEZEL_ID = 16.85;
const MID_Z0 = -3.05;
const MID_Z1 = 3.95;
const LUG_Y = 19.55;
const LUG_TILT = -0.22;

function steel(color: number, roughness: number) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.9,
    roughness,
    clearcoat: roughness < 0.2 ? 0.06 : 0,
    clearcoatRoughness: 0.55,
  });
}

function sapphire(thickness: number) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xeef2f4,
    metalness: 0,
    roughness: 0.07,
    transmission: 0.55,
    ior: 1.5,
    thickness,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    specularIntensity: 0.42,
    side: THREE.DoubleSide,
  });
}

function backSignature() {
  const w = 2048;
  const h = 720;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(28, 26, 22, 0.5)";
  ctx.beginPath();
  ctx.arc(w / 2 + 6, h * 0.14, 58, 0, Math.PI * 2);
  ctx.arc(w / 2 + 22, h * 0.13, 50, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = "Georgia, 'Palatino Linotype', 'Times New Roman', serif";
  ctx.fillStyle = "rgba(28, 26, 22, 0.88)";
  ctx.font = `500 248px ${font}`;
  ctx.fillText("N.40", w / 2, h * 0.4);
  ctx.fillStyle = "rgba(28, 26, 22, 0.62)";
  ctx.font = `300 132px ${font}`;
  ctx.fillText("Nocturne", w / 2, h * 0.74);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const widthMm = 6.2;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthMm, widthMm * (h / w)),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = "caseback_wordmark";
  mesh.rotation.x = Math.PI;
  mesh.position.set(0, 14.35, MID_Z0 - 0.54);
  return mesh;
}

function annulus(outer: number, inner: number, thick: number, z0: number, mat: THREE.Material, segments = 64) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: false,
    curveSegments: segments,
  });
  geom.translate(0, 0, z0);
  return new THREE.Mesh(geom, mat);
}

function latheZ(pts: THREE.Vector2[], segments = 64) {
  const geom = new THREE.LatheGeometry(pts, segments);
  geom.rotateX(Math.PI / 2);
  return geom;
}

/** Rim first, then a light dome — crystal sits in the bezel lip. */
function dressCrystal(radius: number, sag: number, rim = 0.16, segments = 56) {
  const R = (radius * radius + sag * sag) / (2 * sag);
  const theta = Math.asin(Math.min(0.999, radius / R));
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(radius + 0.05, 0),
    new THREE.Vector2(radius, 0.03),
    new THREE.Vector2(radius, rim),
  ];
  for (let i = 0; i <= 18; i++) {
    const t = theta * (1 - i / 18);
    pts.push(new THREE.Vector2(Math.sin(t) * R, rim + Math.cos(t) * R - (R - sag)));
  }
  return latheZ(pts, segments);
}

function crescentShape(outer: number, inner: number, shift: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(shift, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

function dressHorn(signX: 1 | -1, mat: THREE.Material) {
  const yCase = -2.12;
  const yTip = 4.08;
  const shape = new THREE.Shape();
  shape.moveTo(yCase, -0.95);
  shape.quadraticCurveTo(yCase - 0.52, -0.95, yCase - 0.52, 0);
  shape.quadraticCurveTo(yCase - 0.52, 0.95, yCase, 0.95);
  shape.quadraticCurveTo((yCase + yTip) * 0.42, 0.7, yTip, 0.36);
  shape.quadraticCurveTo(yTip + 0.3, 0, yTip, -0.36);
  shape.quadraticCurveTo((yCase + yTip) * 0.42, -0.7, yCase, -0.95);
  shape.closePath();
  const width = 1.58;
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.11,
    bevelSegments: 3,
    curveSegments: 18,
  });
  geom.translate(0, 0, -width / 2);
  geom.rotateX(Math.PI / 2);
  geom.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.x = signX * 8.74;
  return mesh;
}

function lugPair(signY: 1 | -1, mat: THREE.Material) {
  const pair = new THREE.Group();
  pair.name = signY > 0 ? "lug_spec_plus_y" : "lug_spec_minus_y";
  pair.position.set(0, signY * LUG_Y, -0.55);
  if (signY < 0) pair.rotation.z = Math.PI;
  const tilt = new THREE.Group();
  tilt.rotation.x = LUG_TILT;
  tilt.add(dressHorn(1, mat), dressHorn(-1, mat));
  addStrapToLug(tilt, signY > 0);
  pair.add(tilt);
  return pair;
}

function createCrown(polished: THREE.Material, knurlMat: THREE.Material) {
  const crown = new THREE.Group();
  crown.name = "crown";
  crown.position.set(0, 0, 0.12);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.72, 18), polished);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = -CASE_OD + 0.12;

  const body = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(0.78, -0.58),
      new THREE.Vector2(0.92, -0.42),
      new THREE.Vector2(0.98, 0),
      new THREE.Vector2(0.9, 0.42),
      new THREE.Vector2(0.72, 0.55),
    ]),
    knurlMat,
  );
  body.rotation.y = Math.PI / 2;
  body.position.x = -CASE_OD - 0.88;
  crown.add(stem, body);

  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const groove = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.07, 0.09), knurlMat);
    groove.position.set(-CASE_OD - 0.88, Math.sin(a) * 1.0, Math.cos(a) * 1.0);
    groove.rotation.x = a;
    crown.add(groove);
  }

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.82, 0.18, 24), polished);
  cap.rotation.z = Math.PI / 2;
  cap.position.x = -CASE_OD - 1.52;
  const luna = new THREE.Mesh(
    new THREE.ExtrudeGeometry(crescentShape(0.28, 0.22, 0.12), {
      depth: 0.04,
      bevelEnabled: false,
      curveSegments: 24,
    }),
    polished,
  );
  luna.rotation.y = Math.PI / 2;
  luna.position.set(-CASE_OD - 1.62, 0, 0);
  luna.name = "crown_luna";
  crown.add(cap, luna);
  return crown;
}

export function createCase(): THREE.Group {
  const root = new THREE.Group();
  root.name = "case";

  const brushed = steel(0xb7b8bc, 0.38);
  const polish = steel(0xb7b8bc, 0.34);
  const bezelTopMat = steel(0xc5c6c9, 0.16);
  const lugMat = brushed;
  const midZ = (MID_Z0 + MID_Z1) / 2;

  const mid = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(CASE_ID, MID_Z0),
      new THREE.Vector2(19.22, MID_Z0),
      new THREE.Vector2(CASE_OD, MID_Z0 + 0.38),
      new THREE.Vector2(19.22, midZ),
      new THREE.Vector2(CASE_OD, MID_Z1 - 0.32),
      new THREE.Vector2(19.18, MID_Z1),
      new THREE.Vector2(CASE_ID, MID_Z1),
      new THREE.Vector2(CASE_ID, MID_Z0),
    ]),
    brushed,
  );
  mid.name = "mid_case";
  root.add(mid);

  const bezel = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(BEZEL_ID, MID_Z1),
      new THREE.Vector2(BEZEL_ID, MID_Z1 + 0.16),
      new THREE.Vector2(BEZEL_ID + 0.28, MID_Z1 + 0.48),
      new THREE.Vector2(19.14, MID_Z1 + 0.48),
      new THREE.Vector2(19.62, MID_Z1 + 0.16),
      new THREE.Vector2(19.82, MID_Z1),
      new THREE.Vector2(19.18, MID_Z1),
      new THREE.Vector2(BEZEL_ID, MID_Z1),
    ]),
    polish,
  );
  bezel.name = "bezel";
  root.add(bezel);
  const bezelTop = annulus(19.1, BEZEL_ID + 0.32, 0.07, MID_Z1 + 0.45, bezelTopMat);
  bezelTop.name = "bezel_top";
  root.add(bezelTop);

  const back = new THREE.Group();
  back.name = "exhibition_back";
  const brushedBack = steel(0xb5b6ba, 0.36);
  const peek = 8.6;
  const ring = annulus(CASE_OD - 0.18, peek + 0.6, 0.52, MID_Z0 - 0.52, brushedBack);
  const lip = annulus(peek + 0.6, peek, 0.22, MID_Z0 - 0.26, polish);
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(peek - 0.05, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xf2f6f8,
      metalness: 0,
      roughness: 0.06,
      transmission: 0.82,
      ior: 1.5,
      thickness: 0.28,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      specularIntensity: 0.2,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.z = MID_Z0 - 0.2;
  back.add(ring, lip, glass);
  const sign = backSignature();
  if (sign) back.add(sign);
  const screwMat = steel(0xbabcbf, 0.24);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const geom = new THREE.CylinderGeometry(0.55, 0.55, 0.16, 16);
    geom.rotateX(Math.PI / 2);
    const screw = new THREE.Mesh(geom, screwMat);
    screw.position.set(Math.cos(a) * 14.2, Math.sin(a) * 14.2, MID_Z0 - 0.58);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.06), steel(0x9a9b9e, 0.35));
    slot.position.z = -0.09;
    slot.rotation.z = a;
    screw.add(slot);
    back.add(screw);
  }
  root.add(back);

  const crystal = new THREE.Mesh(dressCrystal(16.48, 1.55, 0.16), sapphire(0.62));
  crystal.name = "crystal";
  crystal.position.z = MID_Z1 + 0.14;
  root.add(crystal);

  root.add(lugPair(1, lugMat), lugPair(-1, lugMat));
  root.add(createCrown(polish, steel(0xb6b7bb, 0.42)));

  root.scale.setScalar(MM_SCALE);
  return root;
}

/** Metals with metalness ≥ 0.5. Do not set scene.environment — that washed the cream. */
export function applySteelIbl(root: THREE.Object3D, envMap: THREE.Texture) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (mat.metalness < 0.5) continue;
      mat.envMap = envMap;
      mat.envMapIntensity = mat.roughness < 0.18 ? 0.62 : mat.roughness < 0.33 ? 0.4 : 0.36;
      mat.needsUpdate = true;
    }
  });
}
