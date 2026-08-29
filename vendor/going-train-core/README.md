# Watch Going-Train Core V1

This private handoff isolates the five RC1 compound arbors that carry the
certified going train:

1. barrel 80T → center pinion 12T;
2. center wheel 64T → third pinion 10T;
3. third wheel 60T → fourth pinion 8T;
4. fourth wheel 56T → escape pinion 7T.

It is intended as the mechanical/visual seed for another watch design. The
case, plates, bridges, pallet, balance, display, hands, strap, lighting, and
public-site shell are deliberately excluded from the GLB asset.

## Start here

- `assets/going-train-core.glb` — the five-arbor asset, hierarchy and pivots
  retained, scaled to metres for standard glTF consumers.
- `CORE_SPEC.json` — machine-readable millimetre coordinates, ratios, phases,
  Z planes, clearances, and asset metadata.
- `INTEGRATION.md` — what may safely be redesigned and what invalidates the
  RC1 mesh-clearance claim.
- `source/` — exact RC1 procedural authority plus a small extraction helper.
- `evidence/mechanical/` — the consolidated matrix and four 8,193-state sweep
  reports.
- `SOURCE_AUTHORITY.json`, `MANIFEST.json`, and `SHA256SUMS.txt` — provenance
  and package integrity.

## TypeScript use

```ts
import * as THREE from "three";
import {
  createMaterials,
  createMovement,
  extractGoingTrainCore,
} from "./source/index";

const materials = createMaterials();
const movement = createMovement(materials);
const train = extractGoingTrainCore(movement);

const scene = new THREE.Scene();
scene.add(train.root);

// The retained Movement controller continues to drive the detached arbors.
movement.update(0);
```

The procedural source uses millimetres. The GLB root carries a `0.001` scale
so its world-space dimensions follow glTF's metre convention. Do not remove
that root scale unless the destination scene deliberately treats one unit as
one millimetre.

The GLB uses portable, texture-free PBR approximations of the RC1 metals. The
exact browser material factory is retained in `source/materials.ts`; appearance
is intentionally not part of the mesh-clearance authority.

## Validation

After installing the pinned dependencies:

```sh
npm install
npm run check
```

The check type-checks the source and parses the supplied GLB, confirming that
all five named arbor pivots and a non-empty mesh payload are present.

## Authority boundary

The four zero-intersection findings transfer only while the certified tooth
profiles, tooth counts, pitch radii, XY axes, Z intervals, pair clocking, and
compound-arbor ratios remain unchanged. A new case or bridge design must also
be checked independently for clearances to this train.

This is a private design-source handoff, not a public open-source release. See
`PROJECT_RIGHTS.txt` and `THIRD_PARTY_NOTICES.txt`.
