# Execution review and blind dial test

Historical decision: B was provisional during this execution test. The subsequent blind review selected its unchanged warmth; see [Physical finish](PHYSICAL_FINISH.md). C is parked. This pass uses the corrected Lane 3 geometry without another containment experiment. Add `finish=execution` to a viewer or comparison URL to review the execution revision; historical URLs remain available.

## Changes

- Markers: darker slate main surfaces, narrower polished facets, and lower reflection gain improve visibility against the pale dial. Marker positions and main silhouettes are retained.
- Crystal: analytic spherical normals and reduced specular intensity soften the dominant vertical reflection in the unchanged inspection environment. This approximates a reduced-reflection surface, not a thin-film coating simulation. The glass still reflects the cards; the reflection is less dominant rather than artificially removed.
- Case: analytic profile normals replace sampled-chord averaging on revolved surfaces. The caseback rings now use revolved profiles as well. Dimensions remain unchanged; the captured views show smoother reflection continuity, not proof that every possible angle is artifact-free.
- Strap: a thicker edge and redistributed bend give the attachment more body. The assembly sits 0.2 mm lower, with a shouldered spring bar and a matching bore. The leather remains an authored solid; fold behavior and construction detail are still provisional.

## Geometry and limits

Case diameter remains 40 mm; mid-case height is 7 mm. Crystal to back-ring envelope is 9.37 mm, or approximately 9.55 mm including the lowest screw details. No thinning was justified or performed. The height/proportion decision remains open for review in profile.

The conservative sampled hand-to-inner-crystal gap remains 0.2534 mm; minute-hand swept-radius separation from markers is 0.2931 mm. Attachment bores pass the ray-through check. At the four sampled spring-bar tip centers, the modeled lug shell extends about 0.187 mm beyond the tip radius vertically. These are visual geometry checks, not manufacturing tolerance approval. The crown remains 3 mm across.

## Review artifacts

`/.review/execution/index.html` provides 28 unedited before/after images across seven views and two environments. `/.review/execution/blind.html` provides the shuffled, unlabeled dial test in front and oblique views under bright neutral lighting.

For each blind view, both images come from the same loaded scene. Only the texture map on the shared dial-face/raised-field material is swapped. The seconds well stays fixed, unlike the earlier full B variant. Geometry, transforms, camera, exposure, lighting, and every other material are compared for equality. The ordering is held across views and withheld from the gallery. No color preference is inferred from the captions.

Local validation records: `geometry.json`, `blind-validation.json`, and `errors.json` under `.review/execution/`. The train and vendor assets are untouched.

Validation completed: dependency install, core check (`OK`), TypeScript, production build, gallery image/selector checks, and production viewer smoke check passed. No captured runtime errors. The existing large-bundle build advisory remains. The vendor GLB SHA-256 is unchanged: `E8C950E5D89DF308AA30FE978254320952DEA10F8BF2BEC72F22F65E88437B6B`.
