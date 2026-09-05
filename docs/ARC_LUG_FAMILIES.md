# Arc lug families

The user selected Arc as the exterior direction and authorized related lug exploration. The accepted `main` baseline and original Arc URLs remain unchanged. Open `/lugs.html` to compare any two families; the existing `/explore.html` still compares the original Arc with the accepted baseline.

Standalone candidates use `design=synthesis&finish=physical2&exploration=arc&lug=flow` (or `crest`, `taper`, `arc`). Missing or invalid lug values retain the original Arc. The `lugtop` view adds an upper-lug macro to the shared comparison protocol.

## Four related shapes

| Family | Geometry | Intended read |
| --- | --- | --- |
| Arc | Existing 0.42 mm waist reduction and root transition ending at normalized length 0.36. | Current control. |
| Flow | Same section/waist, with the root transition extended to 0.50. | A longer, more continuous sweep out of the case. |
| Crest | Existing root transition; a softer cross-section and up to 0.10 mm upper arch. | More sculptural reflection across the top. |
| Taper | Up to 0.28 mm added middle width; root transition ending at 0.42. | A fuller, straighter outline. |

Section changes use a smooth envelope that reaches zero at normalized length 0.78. All four families share the same socket and terminal geometry. The case, leather, dial, crown, materials and lighting are held fixed.

## Validation and interpretation

Geometry/material comparisons confirm that only the lug geometry changes. All four are distinct, while the terminal region is identical including normals. Four socket tests per family sample the tip center and perimeter; all rays reach the existing blind end at local |X| = 9.68 mm.

The broader junction check samples the surface beyond the root boundary as well as the boundary itself. It finds maximum local overlap of approximately 0.030 mm in the Arc control, 0.026 mm in Crest, and 0.002 mm in Flow and Taper. These overlap measurements are distinct from the earlier root-boundary-only registration check. Candidate acceptance requires no greater overlap than the Arc control, within a 0.002 mm numerical allowance. This is geometric/render validation, not manufacturing approval.

The neutral/studio renders cover front, oblique, profile, underside and upper-lug macro views. The local four-way sheet is `/.review/lugs/index.html`; individual full-resolution images can be opened from each column. The tracked live page offers pair selection, side swapping, shared views/environments and reflection sweep. No family is promoted automatically.

## Design assessment

Flow is the tentative preference: the longer transition preserves Arc's narrow middle while making the departure from the case more continuous. Crest gives the upper surface a softer, more sculptural highlight. Taper carries more visual weight and feels sturdier, at some cost to the original delicacy. These are subtle differences at whole-watch scale; the upper-lug macro is the more useful comparison. Arc remains the control, and the user has not selected a replacement.

Installation, core check, TypeScript and production build pass (the existing bundle-size advisory remains). Development UI checks cover family selection, side swapping, shared view/environment, reflection sweep and standalone links. Production page loading/selection and all 40 gallery images pass, with no captured runtime exceptions. Review evidence lives locally under `.review/lugs/`; the interactive comparison is tracked and included in the build. The vendor tree is unchanged.
