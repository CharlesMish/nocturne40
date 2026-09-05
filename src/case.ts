/**
 * B8 steel case in spec millimetres, then 0.001 scale.
 * Lugs on spec ±Y; crown at spec −X (3 o'clock after +180° Z).
 * Waisted mid + modest dome so S reads as a dress stack, not a puck.
 */
import * as THREE from "three";
import { receiveSpringTip } from "./socket";
import { addStrapToLug } from "./strap";
import { designStudy, executionFinish, seatingFinish, arcStudy, corrected, physicalStudy, dressFamily, containment, type DesignVariant } from "./design";

import { refinedLathe, crystalShell, opticalGlass } from "./surfaces";

const MM_SCALE = 0.001;
const CASE_OD = 20;
const CASE_ID = 16.85;
const BEZEL_ID = 16.85;
const MID_Z0 = -3.05;
const MID_Z1 = 3.95;
const LUG_Y = 19.55;
const LUG_TILT = -0.22;

export type SteelGrade = "pale" | "steel" | "authored";

function steel(color: number, roughness: number) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.96,
    roughness,
    clearcoat: roughness < 0.14 ? 0.16 : 0,
    clearcoatRoughness: roughness < 0.14 ? 0.2 : 0.55,
    specularIntensity: 1,
  });
}

/** Same grain idea as the exhibition plate: quiet lines, not a show texture. */
function steelBrushMap() {
  const n = 256;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#787878";
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 110; i++) {
    const y = (i / 110) * n;
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + (i % 4) * 0.025})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(n, y + ((i % 3) - 1) * 0.55);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.22, 0.22);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function authoredSatin(grain: THREE.Texture | null, rotation: number, roughness: number) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x6e7278,
    metalness: 0.96,
    roughness,
    roughnessMap: grain ?? undefined,
    anisotropy: grain ? 0.4 : 0,
    anisotropyRotation: rotation,
    specularIntensity: 1,
  });
}

function authoredPolish(roughness: number) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x7c8086,
    metalness: 0.98,
    roughness,
    clearcoat: roughness < 0.05 ? 0.28 : 0.16,
    clearcoatRoughness: roughness < 0.05 ? 0.08 : 0.16,
    specularIntensity: 1,
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

function annulus(outer: number, inner: number, thick: number, z0: number, mat: THREE.Material, segments = 64): THREE.Mesh {
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

/** Longitudinal dress knurl: shallow flutes, not box teeth. Ends closed so it is not a tube. */
function knurlSleeve(radius: number, length: number, flutes: number, depth: number) {
  const radial = Math.max(96, flutes * 3);
  const geom = new THREE.CylinderGeometry(radius, radius, length, radial, 3, false);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r0 = Math.hypot(x, z);
    if (r0 < 1e-6) continue;
    const a = Math.atan2(z, x);
    const groove = 0.5 - 0.5 * Math.cos(flutes * a);
    const r = r0 - depth * groove * groove;
    const s = r / r0;
    pos.setX(i, x * s);
    pos.setZ(i, z * s);
  }
  geom.computeVertexNormals();
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

function dressHorn(signX: 1 | -1, mat: THREE.Material, design: DesignVariant) {
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
  if (dressFamily(design)) {
    // Taper from the rounded case shoulder. Only the outer half moves:
    // the strap-facing surface, bevel, and spring-bar attachment stay fixed.
    const positions = geom.getAttribute("position");
    const halfWidth = width / 2 + 0.14; // Includes the extrusion bevel.
    geom.computeBoundingBox();
    const { min, max } = geom.boundingBox!;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      // Linear along the complete horn keeps each broad cap planar; easing
      // the vertices would bend its large triangles into visible facets.
      const t = (positions.getY(i) - min.y) / (max.y - min.y);
      const outer = THREE.MathUtils.clamp((signX * x) / halfWidth, 0, 1);
      positions.setX(i, x - signX * (2 * halfWidth * 0.2) * t * outer);
    }
    geom.computeVertexNormals();
    geom.computeBoundingBox();
  }
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.x = signX * 8.74;
  return mesh;
}

/** Sampled rounded cross sections let the root and downward tip curve without
 * bending a few large cap triangles. The inner edge clears an 18 mm strap. */
/** Monotone cubic exterior profile for the exploration branch, in mm.
 * Interpolation is shared by the case surface and lug-root registration. */
function arcRadius(z:number){
  const zs=[-3.05,-2.6,-1.6,0,1.8,2.85,3.16,3.95];
  const rs=[18.9,19.36,19.50,19.68,19.94,20,20,19.18];
  if(z>=zs[zs.length-1])return rs[rs.length-1];
  const slopes=zs.slice(1).map((v,i)=>(rs[i+1]-rs[i])/(v-zs[i]));
  const tangent=(i:number)=>i===0?slopes[0]:i===zs.length-1?slopes[i-1]:slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]);
  const j=Math.max(0,Math.min(zs.length-2,zs.findIndex(v=>v>=z)-1));
  const h=zs[j+1]-zs[j],t=THREE.MathUtils.clamp((z-zs[j])/h,0,1);
  return (2*t*t*t-3*t*t+1)*rs[j]+(t*t*t-2*t*t+t)*h*tangent(j)+(-2*t*t*t+3*t*t)*rs[j+1]+(t*t*t-t*t)*h*tangent(j+1);
}

function arcCaseGeometry(){
  const n=128,points=[new THREE.Vector2(CASE_ID,MID_Z0),new THREE.Vector2(arcRadius(MID_Z0),MID_Z0)];
  const meridians=[new THREE.Vector2(0,-1),new THREE.Vector2(0,-1)];
  for(let i=0;i<=n;i++){
    const z=MID_Z0+(MID_Z1-MID_Z0)*i/n;
    const za=Math.max(MID_Z0,z-.0001),zb=Math.min(MID_Z1,z+.0001),slope=(arcRadius(zb)-arcRadius(za))/(zb-za);
    points.push(new THREE.Vector2(arcRadius(z),z));meridians.push(new THREE.Vector2(1,-slope).normalize());
  }
  points.push(new THREE.Vector2(arcRadius(MID_Z1),MID_Z1),new THREE.Vector2(CASE_ID,MID_Z1),new THREE.Vector2(CASE_ID,MID_Z1),new THREE.Vector2(CASE_ID,MID_Z0));
  meridians.push(new THREE.Vector2(0,1),new THREE.Vector2(0,1),new THREE.Vector2(-1,0),new THREE.Vector2(-1,0));
  const g=new THREE.LatheGeometry(points,512);g.rotateX(Math.PI/2);const normals:number[]=[],tangents:number[]=[];
  for(let i=0;i<=512;i++)for(const n of meridians){const a=i/512*Math.PI*2;normals.push(n.x*Math.sin(a),-n.x*Math.cos(a),n.y);tangents.push(Math.cos(a),Math.sin(a),0,1);}
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('tangent',new THREE.Float32BufferAttribute(tangents,4));return g;
}

function studyHorn(signX: 1 | -1, mat: THREE.Material, design: DesignVariant) {
  const soft = design === "sculptural";
  const rings = physicalStudy(design) ? 64 : 32, sides = physicalStudy(design) ? 64 : 24;
  const refined = physicalStudy(design);
  const section = (t: number, a: number) => {
    const ease=t*t*(3-2*t), w=3.05*(1-ease)+1.7*ease-(arcStudy()?.42*Math.sin(Math.PI*t)**2:0);
    const c=Math.cos(a), s=Math.sin(a), exponent=.28+.22*(1-t)**3;
    return new THREE.Vector3(signX*(9.18+w/2+w/2*Math.sign(c)*Math.abs(c)**exponent),
      -3.9+8.05*t, .22*(1-t)-.26*t*t+(1.02*(1-t)+.47*t)*Math.sign(s)*Math.abs(s)**exponent);
  };
  const rootBlend = (t: number, a: number) => {
    const endT=.36;
    if(t>=endT) return section(t,a);
    const end=section(endT,a), start=section(0,a);
    start.x+=signX*.18*Math.cos(a); start.z+=.20*Math.sin(a);
    const tilt=designStudy(design)!.lugTilt, co=Math.cos(tilt), si=Math.sin(tilt);
    // Register every root sample to the cylindrical case wall, rather than
    // burying a flat lug end inside it. The first tangent lies on that wall.
    let worldY=Math.sqrt(19.82**2-start.x**2);
    start.y=(worldY-19.1+start.z*si)/co-.002;
    if(arcStudy())for(let i=0;i<8;i++){
      const z=-.35+si*start.y+co*start.z;
      worldY=Math.sqrt(arcRadius(z)**2-start.x**2);
      start.y=(worldY-19.1+start.z*si)/co-.002;
    }
    const dx=(end.x-start.x)*.7, dz=(end.z-start.z)*.7;
    let dy=(-start.x/worldY*dx+si*dz)/co;
    if(arcStudy()){
      const z=-.35+si*start.y+co*start.z,r=arcRadius(z),slope=(arcRadius(z+.0001)-arcRadius(z-.0001))/.0002;
      dy=(worldY*si*dz+r*slope*co*dz-start.x*dx)/(worldY*co-r*slope*si);
    }
    const c1=start.clone().add(new THREE.Vector3(dx,dy,dz));
    const derivative=section(endT+.0001,a).sub(section(endT-.0001,a)).multiplyScalar(1/.0002);
    const c2=end.clone().addScaledVector(derivative,-endT/3);
    const u=t/endT;
    return start.multiplyScalar((1-u)**3).addScaledVector(c1,3*u*(1-u)**2)
      .addScaledVector(c2,3*u*u*(1-u)).addScaledVector(end,u**3);
  };
  const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const ease = t * t * (3 - 2 * t);
    const width = (soft ? 3.6 : 3.05) * (1 - ease) + 1.7 * ease;
    const centerX = signX * (9.18 + width / 2);
    const y = -3.9 + 8.05 * t;
    const z = (soft ? 0.42 : 0.22) * (1 - t) - 0.26 * t * t;
    const halfHeight = (soft ? 1.22 : 1.02) * (1 - t) + 0.47 * t;
    const exponent = soft ? 0.55 : physicalStudy(design) ? 0.28 + 0.22 * (1-t)**3 : 0.28;
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      if (refined) { const p=rootBlend(t,a); positions.push(p.x,p.y,p.z); }
      else positions.push(centerX + width / 2 * Math.sign(c) * Math.abs(c) ** exponent,
        y, z + halfHeight * Math.sign(s) * Math.abs(s) ** exponent);
      uvs.push(j / sides, t);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = i * sides + j, b = i * sides + (j + 1) % sides;
    indices.push(a, a + sides, b, b, a + sides, b + sides);
  }
  // Separate cap vertices retain a clean end face.
  for (const end of [0, rings]) {
    if (refined && end === 0) continue; // The registered root meets the case wall.
    const base = positions.length / 3;
    for (let j = 0; j < sides; j++) {
      positions.push(...positions.slice((end * sides + j) * 3, (end * sides + j) * 3 + 3));
      const a = j / sides * Math.PI * 2;
      uvs.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    }
    for (let j = 1; j < sides - 1; j++) {
      if (end === 0) indices.push(base, base + j, base + j + 1);
      else indices.push(base, base + j + 1, base + j);
    }
  }
  const geometry = new THREE.BufferGeometry();
  // Reflecting the X coordinates also reflects winding. The historical left
  // horn kept the original indices; correct the physical study only.
  if (refined && signX < 0) for (let i=0;i<indices.length;i+=3) {
    [indices[i+1],indices[i+2]] = [indices[i+2],indices[i+1]];
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const socketGeometry=seatingFinish() && refined ? receiveSpringTip(geometry,signX) : geometry;
  if(socketGeometry!==geometry)geometry.dispose();
  const horn = new THREE.Mesh(socketGeometry, mat);
  horn.name = signX > 0 ? "lug_horn_right" : "lug_horn_left";
  return horn;
}

function lugPair(signY: 1 | -1, mat: THREE.Material, live: boolean, design: DesignVariant) {
  const study = designStudy(design);
  const pair = new THREE.Group();
  pair.name = signY > 0 ? "lug_spec_plus_y" : "lug_spec_minus_y";
  pair.position.set(0, signY * (study ? 19.1 : LUG_Y), study ? -0.35 : -0.55);
  if (signY < 0) pair.rotation.z = Math.PI;
  const tilt = new THREE.Group();
  tilt.rotation.x = study?.lugTilt ?? LUG_TILT;
  if (study) tilt.add(studyHorn(1, mat, design), studyHorn(-1, mat, design));
  else tilt.add(dressHorn(1, mat, design), dressHorn(-1, mat, design));
  addStrapToLug(tilt, signY > 0, live, design);
  pair.add(tilt);
  return pair;
}

function createCrown(polished: THREE.Material, knurlMat: THREE.Material) {
  const crown = new THREE.Group();
  crown.name = "crown";
  crown.position.set(0, 0, 0.12);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.58, 0.34, 48), polished);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = -19.34;
  collar.name = "crown_collar";

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.62, 48), polished);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = -19.9;
  stem.name = "crown_stem";

  const bodyGeom = latheZ(
      [
        new THREE.Vector2(0, -0.6),
        new THREE.Vector2(0.5, -0.6),
        new THREE.Vector2(0.78, -0.52),
        new THREE.Vector2(0.9, -0.32),
        new THREE.Vector2(0.95, -0.08),
        new THREE.Vector2(0.95, 0.12),
        new THREE.Vector2(0.88, 0.36),
        new THREE.Vector2(0.74, 0.5),
        new THREE.Vector2(0.64, 0.56),
        new THREE.Vector2(0, 0.56),
      ],
      96,
    );
  bodyGeom.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeom, knurlMat);
  body.rotation.y = Math.PI / 2;
  body.position.x = -CASE_OD - 0.88;
  body.name = "crown_body";

  const knurl = new THREE.Mesh(knurlSleeve(0.952, 0.7, 32, 0.036), knurlMat);
  knurl.rotation.z = Math.PI / 2;
  knurl.position.x = -CASE_OD - 0.88;
  knurl.name = "crown_knurl";

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 1.12, 48), knurlMat);
  core.rotation.z = Math.PI / 2;
  core.position.x = -CASE_OD - 0.88;
  core.name = "crown_core";

  const capGeom = latheZ(
      [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.64, 0),
        new THREE.Vector2(0.78, 0.02),
        new THREE.Vector2(0.76, 0.12),
        new THREE.Vector2(0.2, 0.17),
        new THREE.Vector2(0, 0.17),
      ],
      64,
    );
  capGeom.computeVertexNormals();
  const cap = new THREE.Mesh(capGeom, polished);
  cap.rotation.y = Math.PI / 2;
  cap.position.x = -CASE_OD - 1.5;
  cap.name = "crown_cap";

  const luna = new THREE.Mesh(
    new THREE.ExtrudeGeometry(crescentShape(0.26, 0.2, 0.11), {
      depth: 0.035,
      bevelEnabled: false,
      curveSegments: 32,
    }),
    polished,
  );
  luna.rotation.y = Math.PI / 2;
  luna.position.set(-CASE_OD - 1.535, 0, 0);
  luna.name = "crown_luna";
  crown.add(collar, stem, body, knurl, core, cap, luna);
  return crown;
}

export function createCase(grade: SteelGrade = "pale", design: DesignVariant = "baseline"): THREE.Group {
  const study = designStudy(design);
  const root = new THREE.Group();
  root.name = "case";

  const authored = grade === "authored";
  const live = grade === "steel";
  const hardwareLive = live || authored;
  const grain = authored ? steelBrushMap() : null;
  const brushed = authored
    ? authoredSatin(grain, 0, 0.46)
    : steel(live ? 0x6a6e73 : 0xb7b8bc, live ? 0.5 : 0.38);
  const polish = authored
    ? authoredPolish(0.06)
    : steel(live ? 0x787c82 : 0xb7b8bc, live ? 0.16 : 0.34);
  const bezelTopMat = authored
    ? authoredPolish(0.035)
    : steel(live ? 0x95989e : 0xc5c6c9, live ? 0.07 : 0.16);
  const lugMat = authored ? authoredSatin(grain, 1.15, 0.38) : brushed;
  const midZ = (MID_Z0 + MID_Z1) / 2;

  const midProfile = study ? (design === "sculptural" ? [
    [CASE_ID, MID_Z0], [18.65, MID_Z0], [19.05, -2.78], [19.38, -2.25],
    [19.62, -1.25], [19.78, 0], [19.9, 1.6], [20, 2.85],
    [19.94, 3.3], [19.55, 3.72], [19.18, MID_Z1], [CASE_ID, MID_Z1], [CASE_ID, MID_Z0],
  ] : [
    [CASE_ID, MID_Z0], [18.9, MID_Z0], [19.45, -2.6], [19.45, -2.24],
    [19.82, -1.85], [19.82, 2.5], [20, 2.85], [20, 3.16],
    [19.18, MID_Z1], [CASE_ID, MID_Z1], [CASE_ID, MID_Z0],
  ]).map(([r, z]) => new THREE.Vector2(r, z)) : [
      new THREE.Vector2(CASE_ID, MID_Z0),
      new THREE.Vector2(19.22, MID_Z0),
      new THREE.Vector2(CASE_OD, MID_Z0 + 0.38),
      new THREE.Vector2(19.22, midZ),
      new THREE.Vector2(CASE_OD, MID_Z1 - 0.32),
      new THREE.Vector2(19.18, MID_Z1),
      new THREE.Vector2(CASE_ID, MID_Z1),
      new THREE.Vector2(CASE_ID, MID_Z0),
    ];
  const sculptedProfile = design === "sculptural" ? [
    midProfile[0],
    ...new THREE.SplineCurve(midProfile.slice(1, -2)).getPoints(64).map(p => new THREE.Vector2(
      THREE.MathUtils.clamp(p.x, CASE_ID, CASE_OD), THREE.MathUtils.clamp(p.y, MID_Z0, MID_Z1),
    )),
    ...midProfile.slice(-2),
  ] : midProfile;
  const mid = new THREE.Mesh(
    arcStudy() && physicalStudy(design) ? arcCaseGeometry() : corrected(design) ? refinedLathe(sculptedProfile,512,0.045,executionFinish()) : latheZ(sculptedProfile, study ? 192 : 64),
    brushed,
  );
  mid.name = "mid_case";
  root.add(mid);

  // Transfer 25% of the flat band's radial width into the outer shoulder.
  // The inner lip, outer case boundary, and all Z levels remain fixed.
  const shoulderInset = study?.bezelInset ?? (dressFamily(design) ? (19.1 - (BEZEL_ID + 0.32)) * 0.25 : 0);
  const bezelProfile = [
      new THREE.Vector2(BEZEL_ID, MID_Z1),
      new THREE.Vector2(BEZEL_ID, MID_Z1 + 0.16),
      new THREE.Vector2(BEZEL_ID + 0.28, MID_Z1 + 0.48),
      new THREE.Vector2(19.14 - shoulderInset, MID_Z1 + 0.48),
      new THREE.Vector2(19.62, MID_Z1 + 0.16),
      new THREE.Vector2(19.82, MID_Z1),
      new THREE.Vector2(19.18, MID_Z1),
      new THREE.Vector2(BEZEL_ID, MID_Z1),
    ];
  // The inherited profile faces inward (including a downward-facing top).
  // Reverse only the new studies so the shoulder is visible and the underside
  // no longer fights the case top when their tessellation differs.
  if (study || corrected(design)) bezelProfile.reverse();
  const bezel = new THREE.Mesh(
    corrected(design) ? refinedLathe(bezelProfile,512,0.045,executionFinish()) : latheZ(bezelProfile, study ? 160 : 64),
    polish,
  );
  bezel.name = "bezel";
  root.add(bezel);
  const bezelTop = annulus(19.1 - shoulderInset, BEZEL_ID + 0.32, 0.07, MID_Z1 + 0.45, bezelTopMat);
  bezelTop.name = "bezel_top";
  if (!corrected(design)) root.add(bezelTop);
  else { bezelTop.geometry.dispose(); bezelTopMat.dispose(); }
  if (containment(design)) {
    bezel.material = polish.clone(); bezel.material.roughness = 0.15; bezel.material.clearcoat = 0;
  }
  if (study) {
    // A restrained polished seam articulates the bottom of the mid-case.
    const seam = annulus(design === "sculptural" ? 19.06 : 19.46, 18.75, 0.11, -2.75, polish, 160);
    seam.name = "case_lower_seam";
    root.add(seam);
    lugMat.color.setHex(design === "sculptural" ? 0x96999b : 0x858b90);
    lugMat.roughness = design === "sculptural" ? 0.24 : 0.31;
    lugMat.anisotropy = 0;
    lugMat.roughnessMap = null;
  }

  if (corrected(design)) {
    const seam = root.getObjectByName("case_lower_seam") as THREE.Mesh | undefined;
    if (seam) { seam.geometry.dispose(); seam.geometry = refinedLathe([
      [18.75,-2.75],[arcStudy()?arcRadius(-2.75)+.025:19.46,-2.75],[arcStudy()?arcRadius(-2.64)+.025:19.46,-2.64],[18.75,-2.64],[18.75,-2.75]
    ].map(([r,z])=>new THREE.Vector2(r,z)),512,0.018,executionFinish()); }
  }
  const back = new THREE.Group();
  back.name = "exhibition_back";
  const brushedBack = authored
    ? authoredSatin(grain, 0.2, 0.44)
    : steel(live ? 0x686c71 : 0xb5b6ba, live ? 0.46 : 0.36);
  const peek = 8.6;
  const backRadius = study ? (design === "sculptural" ? 18.85 : 19.15) : CASE_OD - 0.18;
  const ring = annulus(backRadius, peek + 0.6, 0.52, MID_Z0 - 0.52, brushedBack, 160);
  ring.name = "caseback_ring";
  ring.geometry.computeVertexNormals();
  const lip = annulus(peek + 0.6, peek, 0.22, MID_Z0 - 0.26, polish, 160);
  lip.name = "caseback_lip";
  lip.geometry.computeVertexNormals();
  if (executionFinish() && corrected(design)) {
    const revolve=(outer:number,inner:number,z:number,h:number)=>refinedLathe([
      [inner,z],[outer,z],[outer,z+h],[inner,z+h],[inner,z]
    ].map(([r,z])=>new THREE.Vector2(r,z)),512,.018,true);
    ring.geometry.dispose();ring.geometry=revolve(backRadius,peek+.6,MID_Z0-.52,.52);
    lip.geometry.dispose();lip.geometry=revolve(peek+.6,peek,MID_Z0-.26,.22);
  }
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(peek - 0.05, 128),
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
  const screwMat = authored
    ? authoredPolish(0.12)
    : steel(live ? 0x7a7e84 : 0xbabcbf, live ? 0.2 : 0.24);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const geom = new THREE.CylinderGeometry(0.55, 0.55, 0.16, 32);
    geom.rotateX(Math.PI / 2);
    const screw = new THREE.Mesh(geom, screwMat);
    screw.position.set(Math.cos(a) * 14.2, Math.sin(a) * 14.2, MID_Z0 - 0.58);
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.12, 0.06),
      authored ? authoredSatin(grain, 0, 0.4) : steel(live ? 0x5e6268 : 0x9a9b9e, live ? 0.32 : 0.35),
    );
    slot.position.z = -0.09;
    slot.rotation.z = a;
    screw.add(slot);
    back.add(screw);
  }
  root.add(back);

  const crystal = new THREE.Mesh(corrected(design) ? crystalShell(executionFinish()) : dressCrystal(16.48, 1.55, 0.16), corrected(design) ? opticalGlass(executionFinish()) : sapphire(0.62));
  crystal.name = "crystal";
  crystal.position.z = MID_Z1 + 0.14;
  root.add(crystal);

  root.add(lugPair(1, lugMat, hardwareLive, design), lugPair(-1, lugMat, hardwareLive, design));
  root.add(
    createCrown(
      polish,
      authored ? authoredSatin(grain, 0.6, 0.42) : steel(live ? 0x6e7278 : 0xb6b7bb, live ? 0.44 : 0.42),
    ),
  );

  if (physicalStudy(design)) {
    const crown = root.getObjectByName("crown")!;
    // Scale in crown-group coordinates: the winding axis and projection stay fixed.
    crown.scale.set(1, 3 / (0.952 * 2), 3 / (0.952 * 2));
    // Bridge the inherited 0.11 mm stem-to-body gap without moving the crown.
    const stem = crown.getObjectByName('crown_stem') as THREE.Mesh;
    stem.geometry.scale(1, 0.90 / 0.62, 1);
  }
  root.userData.corrected = corrected(design);
  root.scale.setScalar(MM_SCALE);
  return root;
}

/** Metals with metalness ≥ 0.5. Do not set scene.environment — that washed the cream. */
export function applySteelIbl(root: THREE.Object3D, envMap: THREE.Texture, grade: SteelGrade = "pale") {
  const live = grade === "steel";
  const authored = grade === "authored";
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (mat.metalness < 0.5) continue;
      mat.envMap = envMap;
      if (authored) {
        mat.envMapIntensity =
          mat.roughness < 0.05 ? 1.58 : mat.roughness < 0.1 ? 1.22 : mat.roughness < 0.22 ? 0.78 : mat.roughness < 0.4 ? 0.36 : 0.24;
      } else if (live) {
        mat.envMapIntensity = mat.roughness < 0.12 ? 1.28 : mat.roughness < 0.22 ? 0.92 : mat.roughness < 0.4 ? 0.48 : 0.34;
      } else {
        mat.envMapIntensity = mat.roughness < 0.18 ? 0.62 : mat.roughness < 0.33 ? 0.4 : 0.36;
      }
      if (root.userData.corrected) mat.envMapIntensity = Math.min(mat.envMapIntensity, mat.roughness < 0.16 ? 0.85 : 0.55);
      mat.needsUpdate = true;
    }
  });
}
