import fs from "node:fs";
import crypto from "node:crypto";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import type { MaterialSet } from "../source/materials";
import { createMovement } from "../source/movement";
import { extractGoingTrainCore, GOING_TRAIN_PART_NAMES } from "../source/goingTrainCore";

class NodeFileReader {
  result: string | ArrayBuffer | null = null;
  error: unknown = null;
  onloadend: ((event: { target: NodeFileReader }) => void) | null = null;

  readAsArrayBuffer(blob: Blob): void {
    blob.arrayBuffer()
      .then((result) => {
        this.result = result;
      })
      .catch((error) => {
        this.error = error;
      })
      .finally(() => this.onloadend?.({ target: this }));
  }

  readAsDataURL(blob: Blob): void {
    blob.arrayBuffer()
      .then((result) => {
        const mime = blob.type || "application/octet-stream";
        this.result = `data:${mime};base64,${Buffer.from(result).toString("base64")}`;
      })
      .catch((error) => {
        this.error = error;
      })
      .finally(() => this.onloadend?.({ target: this }));
  }
}

Object.assign(globalThis, { FileReader: NodeFileReader });

const metal = (color: number, roughness: number): THREE.MeshPhysicalMaterial =>
  new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 1 });

// Geometry generation depends only on the MaterialSet slots, not the browser
// canvas textures used by the public renderer. Keep the GLB portable with a
// texture-free material set while copying the exact RC1 material source for
// browser-based reuse.
const createExportMaterials = (): MaterialSet => ({
  wheelFace: metal(0xc0c4cb, 0.34),
  wheelEdge: metal(0xdfe3e8, 0.1),
  escapeFace: metal(0xb2b7c0, 0.32),
  pinion: metal(0xd5dae0, 0.1),
  arbor: metal(0xe6e9ee, 0.07),
  barrelFace: metal(0xc09a52, 0.33),
  barrelEdge: metal(0xddc078, 0.14),
  barrel: metal(0xb8924c, 0.28),
  spring: metal(0xa47d38, 0.42),
  balanceFace: metal(0xccc2b0, 0.3),
  balanceEdge: metal(0xddd4c4, 0.12),
  balance: metal(0xc9bdaa, 0.2),
  hairspring: metal(0x8aa3bc, 0.12),
  screw: metal(0xb08d4c, 0.16),
  jewel: new THREE.MeshPhysicalMaterial({ color: 0x6e1028, roughness: 0.08 }),
  stone: new THREE.MeshPhysicalMaterial({ color: 0x8f1434, roughness: 0.07 }),
});

const output = process.argv[2];
const reportOutput = process.argv[3];
if (!output || !reportOutput) throw new Error("usage: export-glb <asset.glb> <report.json>");

const materials = createExportMaterials();
const movement = createMovement(materials);
movement.update(0);
const core = extractGoingTrainCore(movement);

// Colons are meaningful in Three.js animation track paths and GLTFLoader
// strips them on import. Use stable DCC-friendly asset names while retaining
// the exact RC1 names in the procedural source.
core.root.traverse((object) => {
  object.name = object.name.replaceAll(":", "_");
});

// glTF uses metres. The procedural source and authority reports use mm.
core.root.scale.setScalar(0.001);
core.root.userData = {
  package: "watch-going-train-core-v1",
  authority: "RC1",
  sourceUnit: "millimetre",
  worldUnit: "metre",
  includedParts: [...GOING_TRAIN_PART_NAMES],
};
core.root.updateMatrixWorld(true);

let nodes = 0;
let meshes = 0;
let vertices = 0;
let triangles = 0;
core.root.traverse((object) => {
  nodes += 1;
  if (!(object instanceof THREE.Mesh)) return;
  meshes += 1;
  const position = object.geometry.getAttribute("position");
  vertices += position?.count ?? 0;
  triangles += object.geometry.index
    ? object.geometry.index.count / 3
    : (position?.count ?? 0) / 3;
});

const box = new THREE.Box3().setFromObject(core.root);
const exporter = new GLTFExporter();
const exported = await exporter.parseAsync(core.root, {
  binary: true,
  trs: true,
  onlyVisible: true,
  includeCustomExtensions: false,
});
if (!(exported instanceof ArrayBuffer)) throw new Error("GLTFExporter did not return binary output");

const buffer = Buffer.from(exported);
fs.writeFileSync(output, buffer);
fs.writeFileSync(reportOutput, `${JSON.stringify({
  schema: "watch.going-train-core-asset.v1",
  accepted: true,
  poseTimeSeconds: 0,
  sourceUnit: "millimetre",
  assetWorldUnit: "metre",
  rootScale: 0.001,
  materialMode: "portable texture-free PBR; exact browser material source is included separately",
  includedParts: [...GOING_TRAIN_PART_NAMES],
  nodes,
  meshes,
  vertices,
  triangles,
  boundsMetres: {
    min: box.min.toArray(),
    max: box.max.toArray(),
  },
  bytes: buffer.length,
  sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
}, null, 2)}\n`);
