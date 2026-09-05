/**
 * Viewer shell: GLB + plates + B3 case/dial/hands.
 * Do not import vendor source — only the GLB asset URL.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { reflectionStudio } from "./surfaces";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { applySteelIbl, createCase, type SteelGrade } from "./case";
import { createDial, MARKER_LANES, tickLane, type CreamLook, type MarkerLook, type MarkerStyle, type RehautLook } from "./dial";
import { attachHands, HAND_LANES, SECONDS_LANES, type HandStyle, type SecondsLane } from "./hands";
import { leatherLane } from "./strap";
import { createPlates } from "./plate";
import { designStudy, executionFinish, seatingFinish, arcStudy, parseDesignVariant, corrected, designLabel } from "./design";
import { isComparisonSettings, COMPARISON_POSES, type ComparisonSettings } from "./comparison";
import glbUrl from "../vendor/going-train-core-v1/assets/going-train-core.glb?url";

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
const embedded = new URLSearchParams(location.search).get("embed") === "1";
if (embedded) document.getElementById("hud")!.style.display = "none";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, embedded ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
canvasHost.prepend(renderer.domElement);

const design = parseDesignVariant(new URLSearchParams(location.search).get("design"));
const brightEnvironment = new URLSearchParams(location.search).get('environment') === 'bright';
const pmrem = new THREE.PMREMGenerator(renderer);
let steelEnv: THREE.Texture;
if (corrected(design) || brightEnvironment) {
  const studio = reflectionStudio(brightEnvironment, seatingFinish());
  const cube = new THREE.WebGLCubeRenderTarget(1024, {type: THREE.HalfFloatType});
  new THREE.CubeCamera(0.1, 100, cube).update(renderer, studio);
  steelEnv = pmrem.fromCubemap(cube.texture).texture;
  cube.dispose();
  studio.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
} else steelEnv = pmrem.fromScene(new RoomEnvironment(), 0.08).texture;
pmrem.dispose();

const scene = new THREE.Scene();
const background = new THREE.Color(0x141414);
scene.background = background;

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

const strapGraze = new THREE.DirectionalLight(0xfff3e4, 0.48);
strapGraze.position.set(-6 * MM, 42 * MM, 7 * MM);
strapGraze.visible = false;
scene.add(strapGraze);

const crownSpec = new THREE.DirectionalLight(0xfff6ea, 0.62);
crownSpec.position.set(38 * MM, 3 * MM, 7 * MM);
crownSpec.visible = false;
scene.add(crownSpec);

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

const studyParam = new URLSearchParams(location.search).get("study");
const study =
  studyParam === "4.6" || studyParam === "46"
    ? 4.6
    : studyParam === "4.5" || studyParam === "45"
      ? 4.5
      : studyParam === "1" || studyParam === "2" || studyParam === "3" || studyParam === "4" || studyParam === "5"
        ? Number(studyParam)
        : 4.6;
const steelGrade: SteelGrade = study === 1 ? "pale" : study === 2 ? "steel" : "authored";
const creamLook: CreamLook = "current";
const markerLook: MarkerLook = "current";
const rehautLook: RehautLook =
  study === 5 ? "quiet" : study === 4.6 ? "lift" : study === 4.5 ? "slope" : study === 4 ? "family" : "current";


document.title = `${arcStudy() ? "Arc exploration" : designLabel(design)} \u00b7 Nocturne 40`;
const casing = createCase(steelGrade, design);
applySteelIbl(casing, steelEnv, steelGrade);
if (corrected(design)) {
  const crystal = casing.getObjectByName("crystal") as THREE.Mesh;
  (crystal.material as THREE.MeshPhysicalMaterial).envMap = steelEnv;
}
if (new URLSearchParams(location.search).get("hw") === "1") {
  casing.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    let p: THREE.Object3D | null = obj;
    let hit = false;
    while (p) {
      if (p.name === "crown" || p.name === "exhibition_back") {
        hit = true;
        break;
      }
      p = p.parent;
    }
    if (!hit) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (mat && "wireframe" in mat) (mat as THREE.MeshStandardMaterial).wireframe = true;
    }
  });
}
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

let dial = createDial(markerStyle, creamLook, markerLook, rehautLook, design);
applyDialIbl(dial);
wrapper.add(dial);
wrapper.updateMatrixWorld(true);
explode.dial.attach(dial);

let handMeshes: THREE.Object3D[] = [];
let trainRoot: THREE.Object3D | null = null;
let handStyle: HandStyle = "leaf";
const startHands = new URLSearchParams(location.search).get("hands");
const startCw = new URLSearchParams(location.search).get("cw");
if (startCw === "open" || startHands === "open") handStyle = "open";
const secondsQuery = new URLSearchParams(location.search).get("seconds");
let secondsLane: SecondsLane =
  secondsQuery === "s1" || secondsQuery === "refined" || secondsQuery === "1" ? "s1" : "s0";
let product = true;
let faceVisible = true;
let exploded = false;
type CamView =
  | "dial"
  | "back"
  | "side"
  | "wrist"
  | "oblique"
  | "seconds"
  | "center"
  | "lug"
  | "lug12"
  | "rake"
  | "lugunder"
  | "loopside"
  | "strapedge"
  | "crown"
  | "crownfront"
  | "crown3"
  | "handside"
  | "handoblique"
  | "backoblique";
let camView: CamView = "dial";
const startView = new URLSearchParams(location.search).get("view");
if (
  startView === "side" ||
  startView === "back" ||
  startView === "dial" ||
  startView === "wrist" ||
  startView === "oblique" ||
  startView === "seconds" ||
  startView === "center" ||
  startView === "lug" ||
  startView === "lug12" ||
  startView === "rake" ||
  startView === "lugunder" ||
  startView === "loopside" ||
  startView === "strapedge" ||
  startView === "crown" ||
  startView === "crownfront" ||
  startView === "crown3" ||
  startView === "handside" ||
  startView === "handoblique" ||
  startView === "backoblique"
) {
  camView = startView;
}

type LightMode = "warm" | "cool" | "neutral";
const lightQuery = new URLSearchParams(location.search).get("light");
let lightMode: LightMode = lightQuery === "neutral" ? "neutral" : lightQuery === "cool" || lightQuery === "b" || lightQuery === "B" ? "cool" : "warm";
const inspectQuery = new URLSearchParams(location.search).get("inspect");
let comparisonPose: ComparisonSettings["pose"] | undefined = COMPARISON_POSES.find(p => p === new URLSearchParams(location.search).get("pose"));

function parseMinuteClock(): number | null {
  const v = new URLSearchParams(location.search).get("min");
  if (v === "6") return 6;
  if (v === "5.5" || v === "530") return 5.5;
  if (v === "6.5" || v === "630") return 6.5;
  return null;
}

function applyLightPalette() {
  if (brightEnvironment) {
    background.set(0xb8b8b8);
    hemi.color.set(0xffffff); hemi.groundColor.set(0x808080); hemi.intensity=.65;
    key.color.set(0xffffff); key.intensity=1.4;
    fill.color.set(0xffffff); fill.intensity=.45;
    renderer.toneMappingExposure=1.02;
    return;
  }
  if (lightMode === "neutral") {
    background.set(0x151515);
    hemi.color.set(0xe8e8e8);
    hemi.groundColor.set(0x292929);
    key.color.set(0xffffff);
    fill.color.set(0xe8e8e8);
    renderer.toneMappingExposure = 1.02;
  } else if (lightMode === "cool") {
    background.set(0x16181a);
    hemi.color.set(0xd5dce2);
    hemi.groundColor.set(0x1c2024);
    key.color.set(0xe4eef4);
    fill.color.set(0xd8dee4);
    renderer.toneMappingExposure = 0.94;
  } else {
    background.set(0x141414);
    hemi.color.set(0xe4e3e0);
    hemi.groundColor.set(0x2a2826);
    key.color.set(0xfff3e4);
    fill.color.set(0xe8ebe8);
    renderer.toneMappingExposure = 0.98;
  }
}

function applyViewLights() {
  applyLightPalette();
  const onBack = camView === "back";
  const onSide = camView === "side";
  key.intensity = onBack ? 0.22 : lightMode === "cool" ? 0.82 : 0.92;
  fill.visible = !onBack;
  fill.intensity = onSide ? 0.16 : lightMode === "cool" ? 0.32 : 0.26;
  const onLug =
    camView === "lug" ||
    camView === "lug12" ||
    camView === "lugunder" ||
    camView === "loopside" ||
    camView === "strapedge" ||
    camView === "crown" ||
    camView === "crownfront" ||
    camView === "handside" ||
    camView === "handoblique";
  sideFill.visible = exploded || onSide || camView === "oblique" || camView === "crown3" || onLug || camView === "rake" || camView === "backoblique";
  sideFill.intensity = exploded
    ? 0.4
    : onLug
      ? 0.62
      : camView === "oblique" || camView === "rake" || camView === "crown3"
        ? 0.32
        : 0.5;
  backKey.visible = onBack;
  backFill.visible = onBack;
  peekLight.visible = onBack;
  strapGraze.visible = inspectQuery === "strap";
  crownSpec.visible = inspectQuery === "crown";
  if (brightEnvironment) {
    // One fixed inspection rig, including profile views; no per-view rescue lights.
    key.intensity=1.4; fill.intensity=.45; fill.visible=true;
    for (const light of [sideFill,backKey,backFill,peekLight,strapGraze,crownSpec]) light.visible=false;
  }
}

function applyOrientation() {
  wrapper.rotation.z = product ? PRODUCT_Z : 0;
  const label = product ? "180° product (6 at −Y)" : "0° spec (12 at +Y)";
  if (orientBtn) orientBtn.textContent = `Orientation: ${label}`;
  if (hint && glbUrl) {
    hint.textContent = [
      product ? "Product 180°." : "Spec 0°. +Y = 12.",
      ...(design === "dress1" ? ["Dress 1 comparison."] : []),
      ...(designStudy(design) ? [`${designStudy(design)!.label}.`] : []),
      exploded ? "X assembled." : "X explode.",
      `H ${handStyle}.`,
      `C ${secondsLane.toUpperCase()}.`,
      `F ${markerStyle}.`,
      `M${study}.`,
      leatherLane().toUpperCase(),
      tickLane().toUpperCase(),
      lightMode === "neutral" ? "LN neutral." : lightMode === "cool" ? "LB cool." : "LA warm.",
      inspectQuery === "strap" ? "inspect strap." : inspectQuery === "crown" ? "inspect crown." : "",
      "L lights · C seconds · R · 1 dial · 2 wrist · 3 3/4 · 5 rake · 4 seconds · B caseback · S side · P plates · D face · G grid",
    ].join(" ");
  }
}

function applyNavyIbl(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (mat.metalness >= 0.5) continue;
      mat.envMap = steelEnv;
      mat.envMapIntensity = 0.22;
      mat.needsUpdate = true;
    }
  });
}

function applyDialIbl(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const facet = obj.name.endsWith("_facet");
    const rehaut = obj.name === "rehaut";
    const named =
      rehaut ||
      obj.name === "center_cannon" ||
      obj.name === "seconds_pipe" ||
      obj.name.startsWith("index_");
    if (!facet && !named) return;
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (rehaut && mat.metalness < 0.5) continue;
      mat.envMap = steelEnv;
      mat.envMapIntensity = facet
        ? 0.7
        : obj.name.startsWith("index_")
          ? 0.52
          : rehaut && rehautLook === "family"
            ? 0.86
            : rehaut && (rehautLook === "slope" || rehautLook === "lift")
              ? 1.12
              : 0.38;
      if (executionFinish() && obj.name.startsWith("index_")) mat.envMapIntensity=facet ? .45 : .40;
      mat.needsUpdate = true;
    }
  });
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

let presetFov = 32;
function fitProjection() {
  // Match horizontal framing in the narrow comparison panels.
  camera.fov = embedded && camera.aspect < 1
    ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(presetFov) / 2) / camera.aspect))
    : presetFov;
  camera.updateProjectionMatrix();
}

function applyCamera() {
  camera.up.set(0, 1, 0);
  camera.fov = 32;
  if (camView === "side") {
    camera.position.set(CAM_DIST, 0, 8 * MM);
    controls.target.set(0, 0, 0);
  } else if (camView === "back") {
    camera.position.set(0, 0, -CAM_DIST);
    controls.target.set(0, 0, 0);
  } else if (camView === "wrist") {
    camera.fov = 28;
    camera.position.set(0, 0, 205 * MM);
    controls.target.set(0, 0, 0);
  } else if (camView === "oblique") {
    camera.fov = 32;
    camera.position.set(36 * MM, -24 * MM, 98 * MM);
    controls.target.set(0, -2.2 * MM, 2.2 * MM);
  } else if (camView === "seconds") {
    camera.fov = 24;
    camera.position.set(0, -5.05 * MM, 38 * MM);
    controls.target.set(0, -5.05 * MM, 3.6 * MM);
  } else if (camView === "center") {
    camera.fov = 20;
    camera.position.set(0, 0, 44 * MM);
    controls.target.set(0, 0, 3.7 * MM);
  } else if (camView === "lug") {
    camera.fov = 30;
    camera.position.set(34 * MM, -18 * MM, -14 * MM);
    controls.target.set(0, -19.4 * MM, -0.6 * MM);
  } else if (camView === "lug12") {
    camera.fov = 30;
    camera.position.set(34 * MM, 18 * MM, -14 * MM);
    controls.target.set(0, 19.4 * MM, -0.6 * MM);
  } else if (camView === "rake") {
    camera.fov = 28;
    camera.position.set(54 * MM, 6 * MM, 18 * MM);
    controls.target.set(0, 0, 2.2 * MM);
  } else if (camView === "lugunder") {
    camera.fov = 28;
    camera.position.set(8 * MM, -22 * MM, -28 * MM);
    controls.target.set(0, -21.2 * MM, -2.4 * MM);
  } else if (camView === "loopside") {
    camera.fov = 22;
    camera.position.set(32 * MM, -19.8 * MM, 1.2 * MM);
    controls.target.set(0, -21.4 * MM, -0.8 * MM);
  } else if (camView === "strapedge") {
    camera.fov = 18;
    camera.position.set(18 * MM, -26.2 * MM, 4.6 * MM);
    controls.target.set(7.4 * MM, -23.6 * MM, -1.6 * MM);
  } else if (camView === "crown") {
    camera.fov = 20;
    camera.position.set(32 * MM, 7 * MM, 5 * MM);
    controls.target.set(21.1 * MM, 0, 0.12 * MM);
  } else if (camView === "crownfront") {
    camera.fov = 18;
    camera.position.set(28 * MM, 0.4 * MM, 0.5 * MM);
    controls.target.set(21.2 * MM, 0, 0.12 * MM);
  } else if (camView === "crown3") {
    camera.fov = 32;
    camera.position.set(58 * MM, -24 * MM, 82 * MM);
    controls.target.set(8 * MM, -1.2 * MM, 0.5 * MM);
  } else if (camView === "handside") {
    camera.fov = 14;
    camera.position.set(0.35 * MM, 7.2 * MM, 4.28 * MM);
    controls.target.set(0, 0, 4.12 * MM);
  } else if (camView === "handoblique") {
    camera.fov = 15;
    camera.position.set(7.4 * MM, -5.2 * MM, 11.5 * MM);
    controls.target.set(0, 0, 4.05 * MM);
  } else if (camView === "backoblique") {
    camera.fov = 26;
    camera.position.set(30 * MM, -16 * MM, -70 * MM);
    controls.target.set(0, 0, -3.2 * MM);
  } else {
    camera.position.set(0, 0, CAM_DIST);
    controls.target.set(0, 0, 0);
  }
  presetFov = camera.fov;
  fitProjection();
  camera.lookAt(controls.target);
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
  applyViewLights();
}

function applyMinuteClock() {
  if (comparisonPose) {
    const minutes = comparisonPose === "ten-ten" ? 10 : 38;
    const angles: Record<string, number> = {hour_hand: 300 + minutes / 2, minute_hand: minutes * 6, seconds_hand: 180};
    for (const hand of handMeshes) hand.rotation.z = THREE.MathUtils.degToRad(-(angles[hand.name] + 180));
    return;
  }
  const clock = parseMinuteClock();
  if (clock == null) return;
  const z = THREE.MathUtils.degToRad(-(clock * 30 + 180));
  for (const hand of handMeshes) {
    if (hand.name === "minute_hand") hand.rotation.z = z;
  }
}

function toggleOrientation() {
  product = !product;
  applyOrientation();
}

function rebuildDial() {
  explode.dial.remove(dial);
  dial = createDial(markerStyle, creamLook, markerLook, rehautLook, design);
  applyDialIbl(dial);
  explode.dial.add(dial);
  explode.dial.visible = faceVisible;
  applyOrientation();
}

function rebuildHands() {
  if (!trainRoot) return;
  for (const hand of handMeshes) {
    hand.parent?.remove(hand);
  }
  handMeshes = attachHands(trainRoot, handStyle, secondsLane, design);
  wrapper.updateMatrixWorld(true);
  for (const hand of handMeshes) explode.hands.attach(hand);
  applyNavyIbl(explode.hands);
  applyMinuteClock();
  applyOrientation();
}

orientBtn?.addEventListener("click", toggleOrientation);

let comparisonSweep = false;
const sweepPosition = new THREE.Vector3();
const sweepAxis = new THREE.Vector3(1,0,0);
window.addEventListener("message", event => {
  if (!embedded || event.source !== window.parent || event.origin !== location.origin || !isComparisonSettings(event.data)) return;
  comparisonSweep = event.data.sweep ?? false;
  controls.enabled = !comparisonSweep;
  camView = event.data.view;
  lightMode = event.data.light;
  comparisonPose = event.data.pose;
  product = true;
  exploded = false;
  setFaceVisible(true);
  applyExplode();
  applyMinuteClock();
  applyCamera();
  applyOrientation();
  sweepPosition.copy(camera.position).sub(controls.target);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "f" || event.key === "F") {
    const i = MARKER_LANES.indexOf(markerStyle);
    markerStyle = MARKER_LANES[(i + 1) % MARKER_LANES.length];
    rebuildDial();
  }
  if (event.key === "h" || event.key === "H") {
    const i = HAND_LANES.indexOf(handStyle);
    handStyle = HAND_LANES[(i + 1) % HAND_LANES.length];
    rebuildHands();
  }
  if (event.key === "c" || event.key === "C") {
    const i = SECONDS_LANES.indexOf(secondsLane);
    secondsLane = SECONDS_LANES[(i + 1) % SECONDS_LANES.length];
    rebuildHands();
  }
  if (event.key === "r" || event.key === "R") toggleOrientation();
  if (event.key === "l" || event.key === "L") {
    lightMode = lightMode === "cool" ? "warm" : "cool";
    applyViewLights();
    applyOrientation();
  }
  if (event.key === "1") {
    camView = "dial";
    applyCamera();
  }
  if (event.key === "2") {
    camView = "wrist";
    applyCamera();
  }
  if (event.key === "3") {
    camView = "oblique";
    applyCamera();
  }
  if (event.key === "4") {
    camView = "seconds";
    applyCamera();
  }
  if (event.key === "5") {
    camView = "rake";
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
  fitProjection();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

function tick() {
  if (comparisonSweep) {
    camera.position.copy(sweepPosition).applyAxisAngle(sweepAxis,.35*Math.sin(Date.now()/6000)).add(controls.target);
    camera.lookAt(controls.target);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

function missingVendor() {
  document.body.dataset.ready = "error";
  if (embedded && window.parent !== window) window.parent.postMessage({type: "nocturne:error", design}, location.origin);
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
      try {
        handMeshes = attachHands(trainRoot, handStyle, secondsLane, design);
      } catch (err) {
        console.error(err);
        return;
      }
      wrapper.updateMatrixWorld(true);
      for (const hand of handMeshes) explode.hands.attach(hand);
      if (new URLSearchParams(location.search).get("hw") === "1") {
        explode.hands.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (mat && "wireframe" in mat) (mat as THREE.MeshStandardMaterial).wireframe = true;
          }
        });
      }
      applyNavyIbl(explode.hands);
      applyMinuteClock();
      applyCamera();
      setFaceVisible(true);
      document.body.dataset.ready = "true";
      if (embedded && window.parent !== window) window.parent.postMessage({type: "nocturne:ready", design}, location.origin);
    },
    undefined,
    (err) => {
      console.error(err);
      missingVendor();
    },
  );
}
