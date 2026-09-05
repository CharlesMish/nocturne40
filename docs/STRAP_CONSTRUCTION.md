# Strap construction and seating pass

Review `/.review/physical2/index.html`; the revised live model uses `finish=physical2`. Previous `finish=physical` URLs remain unchanged. No character lane or viewer-default promotion was added.

## Construction

The return is now part of the closed strap solid, wrapping the spring-bar tunnel and transitioning into the lining. The floating underside sheet is removed. The return occupies the existing attachment thickness; its approximately 6.73 mm length ends in a 0.065 mm skive. Central attachment thickness remains 2.3 mm; the lining-side skive reduces the tail's central total to 1.535 mm. Width remains 18 mm at the attachment and 16 mm at the tail.

Padding and stitch placement share the same height function and arc-length path. Fine tonal stitches are seated into the upper surface and stop before the attachment and tail boundaries. The drape retains the open-display extent, with a firmer departure and progressive bend. This is a joined presentation solid, not a separately manufactured layer stack or a complete wearable strap.

Both strap meshes pass welded-edge topology checks: zero boundary edges, non-manifold edges, or collapsed triangles. Attachment bores, hand/crystal clearance (0.2534 mm), and marker sweep clearance (0.2931 mm) pass.

## Leather

Espresso fine-grain calf replaces the previous baked flex shading. A deterministic 4 mm texture tile coordinates subtle color, relief and roughness. Upper surface UVs follow physical width and arc length; the fold uses its own arc-distance mapping. Fabric-like sheen is reduced and clearcoat removed. Edge paint and lining remain separate material regions. The grain is intentionally quiet at normal viewing scale.

## Lug seating

All four inner lug faces now have polygonal blind sockets aligned with the existing spring-bar tips: 0.50 mm diameter, nominal 0.50 mm depth from the inner-face center. Local clipping preserves remote lug geometry and interpolates original normals; no external silhouette or case dimension is redesigned.

Seventeen axial rays per socket, including the full 0.23 mm tip radius, reach the blind end at local |X| = 9.68 mm. Tips end at |X| = 9.60 mm, leaving 0.08 mm axial space. Radial wall sampling also retains metal; detailed values are in `seating.json`. These are model checks, not manufacturing tolerance approval.

## Protected details and reflections

The complete 5/7 marker geometry, including facets, mirrors to numerical precision and uses shared materials. Reduced lengths and material settings are retained. Paired oblique renders mirror camera and lighting to expose directional effects without normalizing either marker.

The warm-face texture and marker, crystal, seconds, bezel and mid-case geometry/materials match the earlier execution reference. Crown, caseback treatment, vendor train, and case dimensions are untouched. No increase in warmth or containment work was performed.

The neutral inspection environment is unchanged. One revised studio rig uses broader feathered cards and a dark separation card, shared consistently by reflective surfaces. Exposure is unchanged. The review includes a nine-position case-reflection sweep; no radial tessellation increase or roughness masking was applied to the case.

## Review evidence

The gallery contains 28 before/after captures, paired marker views, plain-material and leather diagnostics, the isolated socket, and the reflection sweep. Studio before/after images include both lighting and strap changes; neutral images hold lighting fixed. Validation records include `geometry.json`, `seating.json`, `topology.json`, and `preservation.json` under `.review/physical2/`.

Validation completed: dependency install, core check (`OK`), TypeScript, production build, gallery controls, diagnostic images, reflection slider, production viewer, and finish-query forwarding all pass. No captured runtime errors. The existing large-bundle advisory remains. Vendor GLB SHA-256 is unchanged: `E8C950E5D89DF308AA30FE978254320952DEA10F8BF2BEC72F22F65E88437B6B`.
