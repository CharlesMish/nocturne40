/**
 * B1 viewer: load the vendor GLB, wrap it, default +180° around Z.
 * Do not import vendor source — only the GLB asset URL.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const glbModules = import.meta.glob(
  "../vendor/going-train-core-v1/assets/going-train-core.glb",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
const glbUrl = Object.values(glbModules)[0];

const MM = 0.001;
const PRODUCT_Z = Math.PI;

const POSES = [
  "barrel_pose",
  "center_pose",
  "third_pose",
  "fourth_pose",
  "escape_pose",
] as const;

const canvasHost = document.body;
const hint = document.getElementById("hint");
const orientBtn = document.getElementById("orient");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasHost.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141414);

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.0005,
  1,
);
camera.position.set(0, 0, 28 * MM);
camera.up.set(0, 1, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.minDistance = 8 * MM;
controls.maxDistance = 80 * MM;

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(8 * MM, 12 * MM, 24 * MM);
scene.add(key);
const fill = new THREE.DirectionalLight(0xa8c0d8, 0.35);
fill.position.set(-16 * MM, -8 * MM, 10 * MM);
scene.add(fill);

const grid = new THREE.GridHelper(40 * MM, 40, 0x5a5a5a, 0x2a2a2a);
grid.rotation.x = Math.PI / 2;
grid.name = "mm_grid_xy";
scene.add(grid);

const axes = new THREE.AxesHelper(12 * MM);
axes.name = "mm_axes";
scene.add(axes);

const wrapper = new THREE.Group();
wrapper.name = "product_wrapper";
scene.add(wrapper);

let product = true;

function applyOrientation() {
  wrapper.rotation.z = product ? PRODUCT_Z : 0;
  const label = product ? "180° product (6 at −Y)" : "0° spec (12 at +Y)";
  if (orientBtn) orientBtn.textContent = `Orientation: ${label}`;
  if (hint && glbUrl) {
    hint.textContent = product
      ? "Product wrapper +180° Z. Fourth arbor toward 6. R = 0°/180°. 1 = top-down from +Z (+Y up)."
      : "Spec 0°. +Y is 12 o'clock (green axis). R = 0°/180°. 1 = top-down from +Z (+Y up).";
  }
}

function toggleOrientation() {
  product = !product;
  applyOrientation();
}

function topDownFromDial() {
  camera.up.set(0, 1, 0);
  camera.position.set(0, 0, 28 * MM);
  controls.target.set(0, 0, 0);
  camera.lookAt(controls.target);
  controls.update();
}

orientBtn?.addEventListener("click", toggleOrientation);
window.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") toggleOrientation();
  if (event.key === "1") topDownFromDial();
});

applyOrientation();

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

function tick() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

function missingVendor() {
  if (hint) {
    hint.textContent =
      "Missing vendor/going-train-core-v1/assets/going-train-core.glb. Unzip watch-going-train-core-v1.zip into vendor/going-train-core-v1/.";
  }
}

if (!glbUrl) {
  missingVendor();
} else {
  const loader = new GLTFLoader();
  loader.load(
    glbUrl,
    (gltf) => {
      for (const name of POSES) {
        if (!gltf.scene.getObjectByName(name)) {
          console.warn(`missing ${name}`);
        }
      }
      wrapper.add(gltf.scene);
    },
    undefined,
    (err) => {
      console.error(err);
      missingVendor();
    },
  );
}
