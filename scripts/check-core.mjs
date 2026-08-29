#!/usr/bin/env node
/**
 * B0/B1 integrity check. Fail closed if the vendor core is missing or axes drifted.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vendor = join(root, "vendor", "going-train-core-v1");
const specPath = join(vendor, "CORE_SPEC.json");
const glbPath = join(vendor, "assets", "going-train-core.glb");

const expectedAxes = {
  barrel: [-6.045072939534456, -2.818863805810464, 0],
  center: [0, 0, 1.24],
  third: [4.549778035879225, 2.843016852611144, 1.66],
  fourth: [0.14362218235134794, 5.054507434644454, 1.003],
  escape: [-4.035822753424774, 3.2121458309370468, 2.08],
};

const expectedTeeth = {
  "barrel80-center12": [80, 12],
  "center64-third10": [64, 10],
  "third60-fourth8": [60, 8],
  "fourth56-escape7": [56, 7],
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function near(a, b, eps = 1e-6) {
  return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= eps);
}

if (!existsSync(vendor)) {
  fail(`missing ${vendor} — unzip watch-going-train-core-v1.zip there`);
}
if (!existsSync(specPath)) fail(`missing ${specPath}`);
if (!existsSync(glbPath)) fail(`missing ${glbPath}`);

const glbBytes = statSync(glbPath).size;
if (glbBytes < 1000) fail(`GLB too small (${glbBytes} bytes)`);

let spec;
try {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
} catch (err) {
  fail(`CORE_SPEC.json is not valid JSON: ${err.message}`);
}

if (spec.schema !== "watch.going-train-core-spec.v1") {
  fail(`unexpected spec schema: ${spec.schema}`);
}

const axes = spec.partAxesMm;
if (!axes) fail("partAxesMm missing");

for (const [name, xyz] of Object.entries(expectedAxes)) {
  if (!axes[name]) fail(`missing partAxesMm.${name}`);
  if (!near(axes[name], xyz)) {
    fail(`partAxesMm.${name} drifted: got ${JSON.stringify(axes[name])}`);
  }
}

const pairs = spec.pairs;
if (!Array.isArray(pairs) || pairs.length !== 4) {
  fail(`expected 4 mesh pairs, got ${pairs?.length}`);
}

for (const pair of pairs) {
  const exp = expectedTeeth[pair.pairId];
  if (!exp) fail(`unexpected pairId ${pair.pairId}`);
  const { primary, secondary } = pair.toothCounts ?? {};
  if (primary !== exp[0] || secondary !== exp[1]) {
    fail(`tooth counts changed on ${pair.pairId}`);
  }
  if (pair.accepted !== true) fail(`${pair.pairId} is not accepted`);
}

if (spec.asset?.rootScale !== 0.001) {
  fail(`asset.rootScale must stay 0.001 (got ${spec.asset?.rootScale})`);
}

const glb = readFileSync(glbPath);
if (glb.toString("utf8", 0, 4) !== "glTF") fail("vendor asset is not a GLB");
const jsonLen = glb.readUInt32LE(12);
const jsonType = glb.toString("utf8", 16, 20);
if (jsonType !== "JSON") fail("GLB JSON chunk missing");
let gltf;
try {
  gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
} catch (err) {
  fail(`GLB JSON is not valid: ${err.message}`);
}

const nodeNames = new Set(
  (gltf.nodes ?? []).map((node) => node.name).filter(Boolean),
);
for (const arbor of Object.keys(expectedAxes)) {
  if (!nodeNames.has(`${arbor}_pose`)) fail(`GLB missing ${arbor}_pose`);
  if (!nodeNames.has(`${arbor}_motion`)) fail(`GLB missing ${arbor}_motion`);
}

console.log("OK");
console.log(`vendor GLB bytes: ${glbBytes}`);
console.log("five arbor axes match CORE_SPEC authority");
console.log("reminder: product wrapper rotation is +180° around Z — do not bake it into vendor files");
