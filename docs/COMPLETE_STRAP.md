# Complete strap and presentation

The Arc / Flow exterior now has a complete leather strap with open and closed poses. This is an opt-in extension of the accepted physical-detail pass (`cf2fb58`), on `astra/exploration`. The accepted `main` baseline remains `154cb51`.

## Viewing

Run `npm install`, `npm run check`, and `npm run dev`, then open `/watch.html` for the clean interactive presentation. Its views cover the face, profile, caseback and closure. The page uses the complete strap on a nominal 170 mm reference, without displaying the reference or development controls.

The direct viewer URL is:

```text
/?design=synthesis&finish=physical2&exploration=arc&lug=flow&refinement=finish&strap=complete&strapPose=closed&size=170&view=oblique&light=neutral&pose=ten-ten
```

Useful query settings:

| Setting | Meaning |
| --- | --- |
| `strap=complete` | Complete strap; omit for the previous display sections |
| `strapPose=open` / `closed` | Two poses of the same length specification |
| `size=150` through `190` | Nominal elliptical circumference in millimetres; default 170 |
| `view=strapopen` | Camera framing the full open strap |
| `view=closure` | Close view centered on the buckle |
| `view=wearside` | Fixed profile camera for the whole watch and strap |
| `reference=170` | Show the corresponding size guide |
| `environment=bright` | Neutral inspection environment |
| `presentation=1&embed=1` | Hide development controls and disable diagnostic hotkeys; orbit remains available |

The local comparison is `/.review/wearable/compare.html`; saved matched views are at `/.review/wearable/index.html`. These review tools and captures remain local. The comparator matches the watch, environment, exposure and camera settings; closure macros center each buckle separately. On another checkout, open two direct viewer URLs with identical settings, omitting `strap=complete` on the control.

`watch.html` is a tracked Vite build entry. `npm run build` retains the local viewer routes; `npm run build:pages` creates a dedicated presentation homepage with relative asset paths. See [GitHub Pages setup](GITHUB_PAGES.md) for the opt-in publishing workflow.

## Construction

- The buckle half measures 65 mm between attachment and buckle pins. The long half measures 115 mm from its attachment pin to the physical tip.
- Width decreases from 18 mm at the lugs to 16 mm. The rounded tail preserves a simple outline and the existing fine stitching.
- Seven real through-holes have 6 mm pitch. Their developed positions are approximately 63.682, 69.682, 75.682, 81.682, 87.682, 93.682 and 99.682 mm from the attachment pin. Each oval is 2.6 by 1.3 mm.
- Upper leather, lining, edge finish, attachment bores, buckle fork and hole walls are modeled surfaces. The complete strap reuses the accepted leather treatment and finished buckle and keeper.
- The closed path routes the tail below the buckle's front bar, through the tongue engagement and back above the buckle half into the keeper. Rounded transitions maintain positive inner bend radius. The keeper follows the available tail length.
- Pose changes use measured path lengths. The fit solver selects a real hole and adjusts the gap around the reference within its allowed range; it does not scale the leather to make a loop close. Unsupported closure solutions fall back to an open pose with a reason in the viewer metadata.

The 150 / 170 / 190 mm references close on holes 2 / 4 / 7 respectively. Their ellipse has a 1.35 width-to-depth ratio. These are geometry references, not a claim of individualized fit, leather flexibility, manufacturing tolerance or comfort. A physical sample is needed for those judgments.

## Validation and preservation

Independent numerical checks cover fixed developed dimensions, hole positions, exact attachment transforms, tongue engagement, reference clearance, local bend radius and sampled center-section crossings at 150, 170 and 190 mm. Mesh checks cover closed topology and the modeled 170 mm closure's metal and keeper clearances. Local reproducible evidence is saved under `.review/wearable/`.

A scene comparison confirms that all 193 protected meshes outside the strap construction retain identical geometry, transforms and materials, with matching camera and exposure. The warm dial, reduced 5/7 markers, crystal, small seconds, Arc case, Flow lugs, crown and restrained caseback remain as accepted. The vendor train is unchanged.

The presentation is checked on desktop and mobile, and the production build is checked both at a server root and beneath `/nocturne40/`.
