import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

if (!globalThis.ProgressEvent) {
  globalThis.ProgressEvent = class ProgressEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
  };
}

const file = new URL("../assets/going-train-core.glb", import.meta.url);
const bytes = fs.readFileSync(file);
const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const loader = new GLTFLoader();
const gltf = await new Promise((resolve, reject) => loader.parse(arrayBuffer, "", resolve, reject));

const required = ["barrel", "center", "third", "fourth", "escape"];
for (const name of required) {
  if (!gltf.scene.getObjectByName(`${name}_pose`)) throw new Error(`missing ${name}_pose`);
  if (!gltf.scene.getObjectByName(`${name}_motion`)) throw new Error(`missing ${name}_motion`);
}

let meshes = 0;
let vertices = 0;
gltf.scene.traverse((object) => {
  if (!(object instanceof THREE.Mesh)) return;
  meshes += 1;
  vertices += object.geometry.getAttribute("position")?.count ?? 0;
});
if (meshes === 0 || vertices === 0) throw new Error("GLB contains no mesh payload");

const bounds = new THREE.Box3().setFromObject(gltf.scene);
if (bounds.isEmpty()) throw new Error("GLB bounds are empty");
const longestSide = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
if (!(longestSide > 0.005 && longestSide < 0.05)) {
  throw new Error(`unexpected physical scale: ${longestSide} m`);
}

console.log(JSON.stringify({ accepted: true, meshes, vertices, longestSideMetres: longestSide }, null, 2));
