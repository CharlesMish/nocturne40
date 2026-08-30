/**
 * Viewer shell: GLB + plates + B3 case/dial/hands.
 * Do not import vendor source — only the GLB asset URL.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createCase } from "./case";
import { createDial, FACE_LANES, MARKER_LANES, type FaceStyle, type MarkerStyle } from "./dial";
import { attachHands, HAND_LANES, type HandStyle } from "./hands";
import { createPlates } from "./plate";

const glbModules = import.meta.glob(
  "../vendor/going-train-core-v1/assets/going-train-core.glb",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
const glbUrl = Object.values(glbModules)[0];

const MM = 0.001;
const PRODUCT_Z = Math.PI;
const CAM_DIST = 118 * MM;

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
canvasHost.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141414);

const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.0005,
  1,
);
camera.position.set(0, 0, CAM_DIST);
camera.up.set(0, 1, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.minDistance = 12 * MM;
controls.maxDistance = 240 * MM;

const hemi = new THREE.HemisphereLight(0xe4e3e0, 0x2a2826, 0.36);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xfff3e4, 0.92);
key.position.set(10 * MM, 16 * MM, 36 * MM);
scene.add(key);

const fill = new THREE.DirectionalLight(0xe8ebe8, 0.26);
fill.position.set(-16 * MM, 8 * MM, 26 * MM);
scene.add(fill);

const sideFill = new THREE.DirectionalLight(0xf2eee6, 0.48);
sideFill.position.set(50 * MM, 5 * MM, 8 * MM);
sideFill.visible = false;
scene.add(sideFill);

const backKey = new THREE.DirectionalLight(0xffeedd, 1.35);
backKey.position.set(6 * MM, 10 * MM, -48 * MM);
backKey.visible = false;
scene.add(backKey);

const backFill = new THREE.DirectionalLight(0xddd6cc, 0.35);
backFill.position.set(-12 * MM, 6 * MM, -28 * MM);
backFill.visible = false;
scene.add(backFill);
const peekLight = new THREE.DirectionalLight(0xfff0dd, 0.7);
peekLight.position.set(2 * MM, 3 * MM, -22 * MM);
peekLight.visible = false;
scene.add(peekLight);

const grid = new THREE.GridHelper(50 * MM, 50, 0x5a5a5a, 0x2a2a2a);
grid.rotation.x = Math.PI / 2;
grid.name = "mm_grid_xy";
grid.visible = false;
scene.add(grid);

const axes = new THREE.AxesHelper(16 * MM);
axes.name = "mm_axes";
axes.visible = false;
scene.add(axes);

const wrapper = new THREE.Group();
wrapper.name = "product_wrapper";
scene.add(wrapper);

function explodeGroup(name: string) {
  const g = new THREE.Group();
  g.name = name;
  wrapper.add(g);
  return g;
}

const explode = {
  crystal: explodeGroup("explode_crystal"),
  hands: explodeGroup("explode_hands"),
  dial: explodeGroup("explode_dial"),
  plate: explodeGroup("explode_plate"),
  train: explodeGroup("explode_train"),
  bridge: explodeGroup("explode_bridge"),
  caseback: explodeGroup("explode_caseback"),
  case: explodeGroup("explode_case"),
};

/** Extra +Z in wrapper metres (1 mm = MM). Gaps ~2.5 mm between layers. */
const EXPLODE_Z: Record<keyof typeof explode, number> = {
  crystal: 12.5 * MM,
  hands: 10 * MM,
  dial: 7.4 * MM,
  plate: 4.6 * MM,
  train: 0,
  bridge: -2.8 * MM,
  caseback: -5.6 * MM,
  case: 0,
};

/** Slight XY so top-down explode is not a single pile. Wrapper metres. */
const EXPLODE_XY: Partial<Record<keyof typeof explode, { x: number; y: number }>> = {
  dial: { x: 0.8 * MM, y: 0 },
  plate: { x: -0.7 * MM, y: 0 },
  train: { x: 0, y: 0.6 * MM },
};

const plates = createPlates();
wrapper.add(plates);
wrapper.updateMatrixWorld(true);
const plateCluster = plates.getObjectByName("mainplate_cluster");
const bridgeCluster = plates.getObjectByName("bridge_cluster");
if (plateCluster) explode.plate.attach(plateCluster);
if (bridgeCluster) explode.bridge.attach(bridgeCluster);

const casing = createCase();
wrapper.add(casing);
wrapper.updateMatrixWorld(true);
const crystal = casing.getObjectByName("crystal");
const caseback = casing.getObjectByName("exhibition_back");
if (crystal) explode.crystal.attach(crystal);
if (caseback) explode.caseback.attach(caseback);
explode.case.attach(casing);

let markerStyle: MarkerStyle = "curve";
const startMarkers = MARKER_LANES.find((lane) => lane === new URLSearchParams(location.search).get("markers"));
if (startMarkers) markerStyle = startMarkers;
let faceStyle: FaceStyle = "n40";
const startFace = FACE_LANES.find((lane) => lane === new URLSearchParams(location.search).get("face"));
if (startFace) faceStyle = startFace;

let dial = createDial(markerStyle, faceStyle);
wrapper.add(dial);
wrapper.updateMatrixWorld(true);
explode.dial.attach(dial);

let handMeshes: THREE.Object3D[] = [];
let trainRoot: THREE.Object3D | null = null;
let handStyle: HandStyle = "fine";
const startHands = new URLSearchParams(location.search).get("hands");
if (startHands === "leaf" || startHands === "open" || startHands === "fine") handStyle = startHands;
let product = true;
let faceVisible = true;
let exploded = false;
type CamView = "dial" | "back" | "side";
let camView: CamView = "dial";
const startView = new URLSearchParams(location.search).get("view");
if (startView === "side" || startView === "back" || startView === "dial") camView = startView;

function applyViewLights() {
  const onBack = camView === "back";
  const onSide = camView === "side";
  key.intensity = onBack ? 0.22 : 0.92;
  fill.visible = !onBack;
  fill.intensity = onSide ? 0.16 : 0.26;
  sideFill.visible = exploded || onSide;
  sideFill.intensity = exploded ? 0.4 : 0.5;
  backKey.visible = onBack;
  backFill.visible = onBack;
  peekLight.visible = onBack;
}

function applyOrientation() {
  wrapper.rotation.z = product ? PRODUCT_Z : 0;
  const label = product ? "180° product (6 at −Y)" : "0° spec (12 at +Y)";
  if (orientBtn) orientBtn.textContent = `Orientation: ${label}`;
  if (hint && glbUrl) {
    hint.textContent = [
      product ? "Product 180°." : "Spec 0°. +Y = 12.",
      exploded ? "X assembled." : "X explode.",
      `H ${handStyle}.`,
      `F ${markerStyle}.`,
      `C ${faceStyle}.`,
      "R · 1 dial · B caseback · S side · P plates · D face · G grid",
    ].join(" ");
  }
}

function setFaceVisible(visible: boolean) {
  faceVisible = visible;
  explode.dial.visible = visible;
  explode.crystal.visible = visible;
  explode.hands.visible = visible;
}

function applyExplode() {
  for (const name of Object.keys(explode) as (keyof typeof explode)[]) {
    const xy = exploded ? EXPLODE_XY[name] : undefined;
    explode[name].position.set(
      exploded && xy ? xy.x : 0,
      exploded && xy ? xy.y : 0,
      exploded ? EXPLODE_Z[name] : 0,
    );
  }
  applyViewLights();
}

function applyCamera() {
  camera.up.set(0, 1, 0);
  if (camView === "side") camera.position.set(CAM_DIST, 0, 8 * MM);
  else camera.position.set(0, 0, camView === "dial" ? CAM_DIST : -CAM_DIST);
  controls.target.set(0, 0, 0);
  camera.lookAt(controls.target);
  controls.update();
  applyViewLights();
}

function toggleOrientation() {
  product = !product;
  applyOrientation();
}

function rebuildDial() {
  explode.dial.remove(dial);
  dial = createDial(markerStyle, faceStyle);
  explode.dial.add(dial);
  explode.dial.visible = faceVisible;
  applyOrientation();
}

function rebuildHands() {
  if (!trainRoot) return;
  for (const hand of handMeshes) {
    hand.parent?.remove(hand);
  }
  handMeshes = attachHands(trainRoot, handStyle);
  wrapper.updateMatrixWorld(true);
  for (const hand of handMeshes) explode.hands.attach(hand);
  applyOrientation();
}

orientBtn?.addEventListener("click", toggleOrientation);
window.addEventListener("keydown", (event) => {
  if (event.key === "f" || event.key === "F") {
    const i = MARKER_LANES.indexOf(markerStyle);
    markerStyle = MARKER_LANES[(i + 1) % MARKER_LANES.length];
    rebuildDial();
  }
  if (event.key === "c" || event.key === "C") {
    const i = FACE_LANES.indexOf(faceStyle);
    faceStyle = FACE_LANES[(i + 1) % FACE_LANES.length];
    rebuildDial();
  }
  if (event.key === "h" || event.key === "H") {
    const i = HAND_LANES.indexOf(handStyle);
    handStyle = HAND_LANES[(i + 1) % HAND_LANES.length];
    rebuildHands();
  }
  if (event.key === "r" || event.key === "R") toggleOrientation();
  if (event.key === "1") {
    camView = "dial";
    applyCamera();
  }
  if (event.key === "b" || event.key === "B") {
    camView = "back";
    applyCamera();
  }
  if (event.key === "s" || event.key === "S") {
    camView = "side";
    applyCamera();
  }
  if (event.key === "g" || event.key === "G") {
    const show = !grid.visible;
    grid.visible = show;
    axes.visible = show;
  }
  if (event.key === "p" || event.key === "P") {
    const show = !explode.plate.visible;
    explode.plate.visible = show;
    explode.bridge.visible = show;
    applyOrientation();
  }
  if (event.key === "d" || event.key === "D") {
    setFaceVisible(!faceVisible);
    applyOrientation();
  }
  if (event.key === "x" || event.key === "X") {
    exploded = !exploded;
    applyExplode();
    applyOrientation();
  }
});

applyOrientation();
applyCamera();

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
      wrapper.updateMatrixWorld(true);
      explode.train.attach(gltf.scene);
      trainRoot = gltf.scene;
      handMeshes = attachHands(trainRoot, handStyle);
      wrapper.updateMatrixWorld(true);
      for (const hand of handMeshes) explode.hands.attach(hand);
      setFaceVisible(true);
    },
    undefined,
    (err) => {
      console.error(err);
      missingVendor();
    },
  );
}
