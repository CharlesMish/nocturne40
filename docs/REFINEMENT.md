# Dress 1 comparison

The user authorized this refinement beyond B0/B1 on 2026-09-05 and requested
implementation of the restrained-dress comparison plan. This authorization covers
the existing bezel, lug silhouettes, and curved applied markers. All frozen-core
rules in `CONSTRAINTS.md` continue to apply. The current watch remains the default.

Run `npm run dev`, then open `/?design=dress1` for the candidate or
`/?design=baseline` for the current design. Missing or unknown `design` values use
the baseline. Existing view, material, hand, leather, and marker-study URLs still
work; the marker enlargement applies only to the curved family and survives an
F-key cycle back to that family.

The flat bezel band narrows from 1.93 to 1.4475 mm, with the outer shoulder taking
the difference. Case diameter, internal opening, crystal seat, dome, and Z levels
are unchanged. Each lug tapers by removing up to 20% of its width at the tip from
the outer half only. The inner vertices, strap and spring-bar positions are
unchanged. A linear taper preserves the broad cap planes and avoids diagonal
facets from bending the original triangulation.

Curved markers are 10% wider and 15% longer, extending inward from the existing
outer alignment. The 12 marker is capped at 2.90 mm (about 12.4% longer): the full
15% entered the unchanged minute hand's swept radius by 0.007 mm. The cap leaves
0.0599 mm of radial clearance in the rendered geometry. Shortened 5 and 7 markers
and the absent 6 marker remain. The hands, unmarked T0 seconds register, rose-gold
edge, cream, steel finishes, crown, and L1 strap retain their previous defaults.

Local review artifacts are in `.review/dress-refinement/`: `index.html` presents
paired front, wrist, oblique, side, lug, seconds, and back captures at 1280 x 900,
with identical camera, light, and static hand settings. Geometry checks cover
unchanged attachments, planar lug caps, full-circle radial hand envelopes,
seconds containment, and named train pivots. Browser checks cover orientation,
grid, marker rebuilds, explosion/reassembly, URL fallbacks, and existing studies.

Validation: `npm run check`, `node node_modules/typescript/bin/tsc --noEmit`, and
`node node_modules/vite/bin/vite.js build`. Matching Three.js 0.170 type declarations
were added so the TypeScript check can run. The vendor GLB SHA-256 is unchanged:
`e8c950e5d89df308aa30fe978254320952dea10f8bf2bec72f22f65e88437b6b`.

This is a visual design study, not manufacturing clearance or tolerance validation.
No vendor assets, hands, plates, movement architecture, or default selection were
changed by this pass. Review the candidate before promoting it to the default.
