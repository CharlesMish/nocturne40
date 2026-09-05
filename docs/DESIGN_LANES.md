# Three directions for Nocturne 40

The user authorized two complete visual design studies beyond B0/B1, with freedom
to revise colors, case and strap silhouettes, dial furniture, and hand profiles.
The chosen control is **Dress 1**. The frozen vendor train and plate architecture
remain outside this scope. Neither new candidate becomes the default.

Open `/compare.html` after `npm run dev`. The three live panels share view, light,
and hand-position controls. Drag a panel for independent inspection, then use
**Match views** to restore common framing. **Explore** opens that design with the
selected view, lighting, and pose. Narrow screens retain horizontal access to all
three columns.

## Soft Sculptural

The emphasis is a continuous silhouette: fuller rounded lug roots, a curved
mid-case, a narrower bezel band, and a smaller caseback perimeter. The lug opening
accepts an 18 mm strap; the leather tapers gradually to 16 mm instead of pinching
near the spring bar. A little padding and soft surface variation keep the brown
leather supple, with quiet stitching and rounded edges.

The palette moves toward porcelain ivory, ink-blue hands, warm brown leather,
and neutral steel. Tapered applied markers echo the leaf hands, with a small
polished facet and more presence at 12. A narrow crescent of warm metal follows
the lower outside of the seconds register. It is a stationary accent surrounding
a conventional, complete circular hand sweep. No moon phase, retrograde mechanism,
or relocated arbor is implied.

This is the more fluid interpretation. The crescent intentionally reads as a
small gathering of warmth at product scale; its shape becomes clearer close up.

## Precise Dress

The case uses a more defined shoulder and lower chamfer, with firmer lug edges and
a flatter leather profile. The same 18-to-16 mm taper makes the strap transition
cleaner, while dark umber gives the pale champagne face a quieter frame.

Crisp applied markers sit inside a single fine minute scale. The seconds register
has twelve marks, with stronger quarter divisions. The leaf hands are narrowed
and their widest points move inward for a more controlled silhouette. The warm
metal remains a circular boundary around seconds.

This is the more formal interpretation. The scales are meant to become apparent
on inspection while preserving a quiet face at wrist scale.

## Geometry and rendering decisions

The old faint dial circle corresponds to a raised central field of radius 12.2 mm.
Both candidates extend that field to the dial edge; Dress 1 retains the original
surface. This is a candidate geometry change, not a global lighting correction.
The new lug meshes have UV coordinates and use an isotropic steel finish. This
avoids undefined directional shading on the new surfaces; the control's existing
materials remain unchanged. Candidate leather uses soft gradients and fine grain
instead of hard-edged mottling. Lighting is shared rather than tuned per panel.
The inherited bezel profile faces inward. The candidates reverse that profile so
the shoulder faces outward; otherwise its exposed underside fights the case top
when the two surfaces have different tessellation. Dress 1 keeps its original
profile as the control. Candidate validation explicitly checks top-face normals.

All three case diameters remain 40 mm. Existing crystal seating and movement
envelopes remain intact. In the rendered geometry, radial minute-hand clearance
is approximately 0.060 mm for Dress 1, 0.242 mm for Soft Sculptural, and 0.293 mm for
Precise Dress. Both new straps have 0.180 mm clearance from the inner lug surfaces.
The modeled main-hand-to-crystal gap is at least approximately 0.55 mm under the
conservative radial sweep check. These are visual-model checks, not manufacturing
tolerances or a certification of the inherited assembly.

## Interfaces and validation

`?design=baseline`, `?design=dress1`, `?design=sculptural`, and `?design=precise`
select the variants. Missing/invalid values still choose baseline. Existing study
parameters remain available; the candidate-specific marker family occupies the
existing `curve` selection, and survives a marker cycle back to it. Candidate
palettes and leather finishes are coordinated by `src/design.ts`.

`?embed=1` hides the inspection HUD and fits narrow panels. `?pose=ten-ten` and
`?pose=ten-thirty-eight` set repeatable hand positions; seconds points to 30.
`?light=neutral` adds a common neutral palette without changing the existing warm
or cool defaults. Embedded viewers accept only validated same-origin messages
from their parent. Ready/error responses are validated against each iframe.

Vite builds both `index.html` and `compare.html`. Validation commands are
`npm run check`, `node node_modules/typescript/bin/tsc --noEmit`, and
`node node_modules/vite/bin/vite.js build`.

Local artifacts in `.review/three-lanes/` include matched stills, `index.html`,
the comparison screenshots, and `validation.json`. Checks cover full-circle hand
sweeps, the crystal envelope, strap joins and clearances, pivots/scale/orientation,
all seven shared views, both lighting/pose settings, reset, message validation,
rebuilds, URL fallback, and narrow-screen layout. The vendor GLB SHA-256 remains
`e8c950e5d89df308aa30fe978254320952dea10f8bf2bec72f22f65e88437b6b`.
