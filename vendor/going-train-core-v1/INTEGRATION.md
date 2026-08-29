# Integration guide

## Frozen if you want to retain the RC1 going-train claim

- module and all wheel/pinion tooth counts;
- the five arbor XY axes and pair center distances;
- wheel and pinion pitch/root/tip radii;
- the non-expanding involute working profiles and `0.02 mm` mesh backlash;
- the accepted pinion clocking offsets (`-9.2°`, `-12.05°`, and
  `17.785714285714285°` where specified);
- the wheel/pinion Z mid-planes and rendered Z slabs;
- the rigid compound-arbor relationships and signed motion ratios.

Changing any item above creates a new train that needs new full-cycle mesh
sweeps. Scaling the entire train also scales its clearances and is not covered
by the original millimetre-valued reports.

## Good redesign territory

- case, bezel, crystals, lugs, crown, strap, and external silhouette;
- mainplate and bridge sculpture, provided new solids receive fresh clearance
  checks against every moving part;
- jewel, chaton, and fastener presentation around the frozen bearing axes;
- colors, PBR materials, finishing, lighting, cameras, and background;
- dial/readout architecture that stays outside the train's swept volumes;
- optional omission or redesign of pallet/balance architecture, with a new
  escapement analysis if the escape club geometry or timing changes.

## Recommended workflow for a new watch

1. Import the GLB or procedural source without altering the five arbor poses.
2. Treat `CORE_SPEC.json` axes and Z intervals as a locked datum layer.
3. Sculpt plates, bridges, case, and display around that datum.
4. Audit static foreign-solid clearances early, before surface finishing.
5. If the going train changes, rerun all four complete repeating-cycle sweeps;
   a single attractive still is not mesh evidence.
6. Give the derivative its own release name and authority manifest. Do not
   describe altered bytes as the original RC1 train.

## GLB hierarchy

The asset root is `going-train-core-v1`. Each compound arbor retains a named
pose pivot and a nested motion pivot:

```text
going-train-core-v1
├── barrel_pose  → barrel_motion
├── center_pose  → center_motion
├── third_pose   → third_motion
├── fourth_pose  → fourth_motion
└── escape_pose  → escape_motion
```

Rotate the `*_motion` nodes, not the `*_pose` nodes. The pose nodes own the
accepted world axes and Z placement.
