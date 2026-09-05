# B / C: controlled second-environment validation

**Superseded decision: B remains only a provisional dial-temperature preference; C is parked.** See [the execution review](EXECUTION.md) and its blind dial-only comparison. The findings below document the earlier test, not a character freeze.

**Earlier assessment:** The test shows no reason to abandon it, but does not demonstrate a substantial improvement from its warmth alone. No palette, geometry, or character variant was changed for this validation, and the historical viewer default remains available.

## Findings

- **B versus A:** the warmth is real but very small. In three unobstructed front-dial patches under the brighter setup, B differs from A by approximately **+1.1 red, -0.3 green, -1.6 to -1.8 blue** on an 8-bit RGB scale. At ordinary comparison size they are nearly indistinguishable; alternating the matched images makes the slight cream shift easier to detect. My earlier description of warmth as a meaningful character contribution was too strong. B is a reasonable preference to retain, not a decisively superior hue demonstrated by these renders.
- **C versus A:** containment survives. The darker inner ring remains visible head-on and suppresses the bright inner lip in the oblique view. It did not evaporate with the dark backdrop. However, its visual strength varies with angle and reflected light; it also makes the face feel flatter and less luminous to me. That is a tradeoff, not an objective improvement. C bundles a rehaut change with a bezel-finish change, so this test does not attribute the entire effect to rehaut color alone.
- **B versus C:** B retains a more open, luminous boundary. Since B is the user's preferred direction and relighting exposes no character failure, the earlier assessment retained it as the working base; the subsequent user review explicitly deferred that decision. Do not automatically merge C, increase B's warmth, or generate further character variants.

## Controlled setup

The saved comparison is at `/.review/relight/index.html`. It opens B/C, with A/B and A/C controls available. Front, oblique, profile, and crystal-rake views are captured in both environments: **24 unedited screenshots** in total.

The live comparison now offers **Bright neutral inspection** in the Environment selector. It is a genuinely different reflection environment, not just a brighter backdrop:

- Neutral gray background `#b8b8b8`; environment surround linear RGB `(0.85, 0.85, 0.85)`.
- A tall white card, a narrow dark flag, and an overhead white card, with sharper feathered edges than the original studio. Captured into the same 1024-pixel cube/PMREM pipeline.
- White key intensity 1.4, white fill 0.45, neutral hemisphere 0.65. No view-specific auxiliary lights in this setup.
- ACES exposure **1.02 throughout**, including the original-studio control renders, which use the existing neutral-light preset. Therefore these original-studio control images are not the earlier warm-light/exposure-0.98 screenshots.
- Identical camera position, target, FOV, image size, hand pose, model transforms, and geometry for A/B/C at each view. No post-processing, color adjustment, or exposure compensation between candidates.

Recorded scene states verify the matching camera, lights, exposure, geometry and transforms. Material differences are restricted to B's dial/seconds palette and C's bezel/rehaut treatment. An unrelated caseback-wordmark canvas raster hash varied between some loads; its numerical material parameters and geometry matched, and it is outside the face comparison. Detailed records and fixed-patch samples are in `.review/relight/validation.json` and `states.json`.

## Return to execution

The brighter setup makes the remaining priorities clearer without changing them during this validation:

1. **Crystal:** the reflection now follows a surface, but the tall card still becomes a broad pale wash over much of the dial. Refine the optical response and reflection footprint on B under both saved environments; do not solve it by hiding the reflection or changing the dial.
2. **Strap:** padding and attachments improved, but the profile still has a long, very uniform bend and a thin edge read beside the case. Assess bend distribution, cross-section, and attachment behavior together before adding texture.
3. **Polished surfaces:** the old conspicuous stepped highlight is much reduced. The bright rake still exposes hard transitions and thin perimeter seams. Check those during motion, distinguishing actual facets from intentional edges and antialiasing. One clean still is not proof of convergence.
4. **Case height:** this remains an open proportion decision. The previous measured profile established **7.00 mm mid-case**, **9.37 mm crystal-to-back-ring envelope**, and approximately **9.55 mm including screw details**. That established dimensions, not an aesthetically or mechanically resolved thickness. The new side view still reads as a substantial continuous flank next to a thin strap edge. Assess that relationship with assembled section/clearances and a representative strap posture before proposing any reduction. Apparent empty space is not automatically removable allowance.

No case thinning, aperture change, furniture edit, or drivetrain change was made. This is the requested small validation, with B recorded as the character base rather than another redesign.
