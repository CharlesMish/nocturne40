/**
 * B8 steel case in spec millimetres, then 0.001 scale.
 * Lugs on spec ±Y; crown at spec −X (3 o'clock after +180° Z).
 * Waisted mid + modest dome so S reads as a dress stack, not a puck.
 */
import * as THREE from "three";
import { addStrapToLug } from "./strap";

const MM_SCALE = 0.001;
const CASE_OD = 20;
const CASE_ID = 16.35;
const BEZEL_ID = 16.35;
const MID_Z0 = -3.05;
const MID_Z1 = 3.95;
const LUG_Y = 19.55;
const LUG_TILT = -0.22;

function steel(color: number, roughness: number) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.9,
    roughness,
    clearcoat: roughness < 0.22 ? 0.12 : 0,
    clearcoatRoughness: 0.45,
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
    opacity: 0.28,
    depthWrite: false,
    specularIntensity: 0.28,
    side: THREE.DoubleSide,
  });
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

function modestDome(radius: number, sag: number, segments = 48) {
  const R = (radius * radius + sag * sag) / (2 * sag);
  const theta = Math.asin(Math.min(0.999, radius / R));
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * theta;
    pts.push(new THREE.Vector2(Math.sin(t) * R, Math.cos(t) * R - (R - sag)));
  }
  return latheZ(pts, segments);
}

function dressHorn(signX: 1 | -1, mat: THREE.Material) {
  const y0 = -2.85;
  const y1 = 3.85;
  const xIn0 = signX * 7.7;
  const xOut0 = signX * 10.05;
  const xIn1 = signX * 8.35;
  const xOut1 = signX * 9.55;
  const shape = new THREE.Shape();
  if (signX > 0) {
    shape.moveTo(xIn0, y0);
    shape.lineTo(xOut0, y0);
    shape.lineTo(xOut1, y1);
    shape.quadraticCurveTo((xOut1 + xIn1) * 0.5, y1 + 0.32, xIn1, y1);
    shape.lineTo(xIn0, y0);
  } else {
    shape.moveTo(xOut0, y0);
    shape.lineTo(xIn0, y0);
    shape.lineTo(xIn1, y1);
    shape.quadraticCurveTo((xOut1 + xIn1) * 0.5, y1 + 0.32, xOut1, y1);
    shape.lineTo(xOut0, y0);
  }
  const thick = 1.72;
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.14,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geom.translate(0, 0, -thick / 2);
  return new THREE.Mesh(geom, mat);
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
  crown.position.set(0, 0, 0.15);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.78, 16), polished);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = -CASE_OD + 0.18;

  const knurl = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.04, 1.28, 28), knurlMat);
  knurl.rotation.z = Math.PI / 2;
  knurl.position.x = -CASE_OD - 0.92;

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.94, 0.24, 24), polished);
  cap.rotation.z = Math.PI / 2;
  cap.position.x = -CASE_OD - 1.66;

  crown.add(stem, knurl, cap);
  return crown;
}

export function createCase(): THREE.Group {
  const root = new THREE.Group();
  root.name = "case";

  const brushed = steel(0xb7b8bc, 0.38);
  const polished = steel(0xd4d5d8, 0.2);
  const lugMat = steel(0xc0c2c6, 0.26);
  const midZ = (MID_Z0 + MID_Z1) / 2;

  const mid = new THREE.Mesh(
    latheZ([
      new THREE.Vector2(CASE_ID, MID_Z0),
      new THREE.Vector2(19.35, MID_Z0),
      new THREE.Vector2(CASE_OD, MID_Z0 + 0.42),
      new THREE.Vector2(19.12, midZ),
      new THREE.Vector2(CASE_OD, MID_Z1 - 0.38),
      new THREE.Vector2(19.28, MID_Z1),
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
      new THREE.Vector2(19.05, MID_Z1),
      new THREE.Vector2(19.42, MID_Z1 + 0.1),
      new THREE.Vector2(19.22, MID_Z1 + 0.28),
      new THREE.Vector2(BEZEL_ID + 0.12, MID_Z1 + 0.28),
      new THREE.Vector2(BEZEL_ID, MID_Z1 + 0.14),
      new THREE.Vector2(BEZEL_ID, MID_Z1),
    ]),
    polished,
  );
  bezel.name = "bezel";
  root.add(bezel);

  const back = new THREE.Group();
  back.name = "exhibition_back";
  const brushedBack = steel(0x9a9a97, 0.4);
  const peek = 8.6;
  const ring = annulus(CASE_OD - 0.18, peek + 0.6, 0.52, MID_Z0 - 0.52, brushedBack);
  const lip = annulus(peek + 0.6, peek, 0.22, MID_Z0 - 0.26, polished);
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
  const screwMat = steel(0xd0d1d4, 0.18);
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

  const crystal = new THREE.Mesh(modestDome(15.5, 1.46), sapphire(0.7));
  crystal.name = "crystal";
  crystal.position.z = MID_Z1 + 0.22;
  root.add(crystal);

  root.add(lugPair(1, lugMat), lugPair(-1, lugMat));
  root.add(createCrown(polished, steel(0xb8babf, 0.42)));

  root.scale.setScalar(MM_SCALE);
  return root;
}
