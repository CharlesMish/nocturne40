# Arc / Flow physical finishing

The user authorized another exterior detail pass while emphasizing the case's role in supporting the warm face and restrained furniture. This pass preserves that relationship. The selected Flow geometry and the case body are unchanged; the new work is opt-in with `refinement=finish` on `design=synthesis&finish=physical2&exploration=arc&lug=flow`.

Open `/finish.html` for a matched live comparison. The local render sheet is `/.review/finish/index.html`; its separate size-reference sheet is `/.review/finish/reference.html`. The selected exterior without this finish remains the control. No train work is included.

## Buckle and leather

The three overlapping buckle boxes become one continuous U-frame with small edge radii. Its 18.2 by 6 by 0.65 mm envelope and 16.6 mm opening are retained. A pivot eye joins the thin curved tongue to the pin; the tongue rests on the front bar. A real central relief in the leather's folded terminal clears the eye while preserving the two outer pin-bearing leaves.

The keeper has rounded inner and outer corners, physical 4 mm grain mapping, and room for a second leather layer. It moves from the strap midpoint to three-quarters of its length, approximately 9.29 mm from the buckle in this display pose. The strap spine, lengths, widths, upper leather material, stitches and lug attachments remain the reference. This is a hardware construction pass, with no arbitrary drape change to fit a picture.

Measured clearances are approximately 0.025 mm between eye and pin, 0.282 mm longitudinally and 0.205 mm per side around the leather relief, and 0.106 mm minimum in the sampled keeper-to-strap check. The tongue's contact gap is below 0.001 mm. Modified strap and hardware solids pass welded-edge checks with no open edges, nonmanifold edges or degenerate triangles. These are model checks, not manufacturing tolerances.

## Caseback

The previous screw heads and raised slot boxes projected up to 0.18 mm below the broad ring. Four shallow pockets now receive heads recessed by 0.005 mm. Actual blind slots replace the raised boxes. The pocket leaves 0.355 mm of ring material, and the slot leaves 0.085 mm of head material beneath it. The N.40 wordmark, window, caseback footprint and ring height stay fixed.

Only four narrow sectors of the flat underside are retriangulated around the seats. Original radial UV mapping and continuous tangents carry the brushed finish across those sectors; the other 960 of 1,024 underside triangles and all non-bottom ring triangles retain their original attributes. No roughness increase or texture removal is used to hide a shading seam.

The case body remains 40 mm in maximum diameter and 7 mm in height. Removing the projecting hardware changes the solid envelope from approximately 9.55 mm to 9.37 mm; this is not a thinner mid-case. The unchanged cosmetic wordmark plane can produce a 9.39 mm mesh bounding box. Ring, pocket and screw surfaces are checked for closure and correct orientation, including rays into the actual slot walls and floors.

## Wrist-scale assessment

Both leather halves are approximately 37.164 mm long along their centerlines. They are short open-display sections, not a complete wearable strap. Their dimensions cannot establish a wrist circumference, comfortable fit or final buckle location.

The optional size envelopes use 150, 170 and 190 mm elliptical cross-sections with a 1.35 width-to-depth ratio. Circumference is scaled with Ramanujan's ellipse approximation; these are clearly labeled shape references rather than anatomy. The 170 mm reference is approximately 61.83 mm wide and 45.80 mm deep. The reference's top is tangent to the broad caseback ring at Z = -3.57 mm. Both comparison panels use the same placement and open strap pose.

The useful finding is that the case's visual weight survives at this scale, while the strap's open ends and stand-off remain evident. A future wearable study needs specified strap lengths, a returning tail and adjustment holes, and a closure pose built around a chosen wrist reference. This pass does not imply that work is complete.

## Review and validation

The comparisons hold geometry outside the target details, materials, camera, environment, exposure and hands fixed. Hardware studio macros use a shared local fill; neutral inspection retains its existing fixed rig. Geometry/material snapshots match for 253 unaffected meshes, including the case flank, bezel, Flow lugs, crown, dial, reduced markers, hands and crystal. The comparison starts at the buckle so the local changes can be assessed, with whole-watch views available as a check on character.

Local evidence includes `hardware.json`, `caseback-check.json`, `preservation.json`, matched renders and UI checks under `.review/finish/`. The live comparison and size reference are included in the production build; local screenshots and audit scripts remain excluded from Git.

Dependency install, core check, TypeScript and production build pass. The viewer's existing bundle-size advisory remains. Development controls and all 38 saved review images pass their loading checks; standalone captions clear the HUD, and the profile reflection sweep moves correctly. The frozen GLB SHA-256 remains `E8C950E5D89DF308AA30FE978254320952DEA10F8BF2BEC72F22F65E88437B6B`.
