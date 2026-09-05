# Astra exploration: Arc study

The accepted Nocturne40 baseline is commit `154cb51` on `main`. The user authorized a separate `astra/exploration` branch and broader exterior design freedom on 2026-09-05. The possible train-core fix mentioned by the user is a separate future review; no vendor or train changes are authorized by this study.

Run the viewer and open `/explore.html`. It compares the accepted finish with the opt-in `exploration=arc` study, both using `design=synthesis&finish=physical2`. The ordinary accepted-design URL remains unchanged. The comparison offers shared view presets, studio/neutral environments, fixed 10:10 hands and a synchronized reflection sweep.

Flow is now the selected Arc lug family following user review. The comparison shows Arc / Flow; `lug=arc` recalls the original lugs described below. See [the lug-family selection](ARC_LUG_FAMILIES.md). Flow's reviewed geometry is locked without borrowing Taper's fuller middle.

## First design proposition

Give the case, lugs and strap a more continuous side silhouette. Replace the broad cylindrical flank with a gentle outward curve rising toward the existing upper shoulder. Narrow the middle of each lug by up to 0.42 mm while retaining its inner strap boundary, then let the leather bend slightly earlier beyond the secured terminal.

The exterior curve uses monotone cubic interpolation and profile-derived normals. Its radius function also registers the lug roots and their departure tangents to the case. The lower seam follows the revised flank. This is a shape experiment under unchanged materials and lighting; the dial and bezel are held as the visual reference.

## What stays fixed

- 40 mm maximum diameter, existing interior wall and 7 mm mid-case height; approximately 9.55 mm overall case envelope.
- Crown position and geometry, crystal, warm face, hands, reduced 5/7 markers, seconds detailing and caseback treatment.
- Spring-bar axis, socket geometry, strap widths and material identity.
- Vendor core, arbor placement, scale and product orientation.

## Assessment

The initial renders show the strongest difference in profile and flank reflections: the case reads less cylindrical, while the face remains familiar. The narrower lug middle adds delicacy, but whether that makes the whole watch more distinctive is still a design judgment. This is a first branch checkpoint, not a replacement for the accepted watch.

## Validation

- Socket clearance and sampled wall checks pass; the reduced 5/7 geometry remains mirrored.
- Both strap bodies remain closed, with zero non-manifold edges or collapsed triangles in the welded-edge check.
- Across 256 lug-root samples, measured contact against the actual case triangles lies about 0.0011–0.0018 mm inside the surface, retaining the intentional tiny registration overlap.
- The warm face texture and marker/crystal/seconds/bezel geometry and material snapshots match the previous reference.
- Saved matched images cover front, oblique, profile, lug underside and flank in two environments. Local evidence is in `.review/arc/`; the live comparison page is tracked and included in the production build.

Core, TypeScript, production build, paired-view controls, environment forwarding and reflection-sweep controls pass. The production build includes the exploration page; the existing large-bundle advisory remains. No vendor diff is present.
