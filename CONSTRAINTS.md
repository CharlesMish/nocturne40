# Constraints — do not improvise past these

Authority for the train is `vendor/going-train-core-v1/`.
If this file and an agent’s taste disagree, this file wins.

## Vendor is read-only

Do not modify, re-export, “clean”, prettify, re-center, rescale, or re-topologize:

- `vendor/going-train-core-v1/**`

That includes `CORE_SPEC.json`, the GLB, tooth profiles, clocking, Z slabs, and materials inside the vendor tree.

Copy values **out**. Never rewrite the source.

## Frozen train (RC1)

From `CORE_SPEC.json` + `INTEGRATION.md`:

- module `0.145` mm
- tooth counts: barrel 80, center 12/64, third 10/60, fourth 8/56, escape pinion 7
- XY axes, center distances, involute working profiles, `0.02` mm backlash
- accepted pinion clocking
- wheel/pinion Z mid-planes and rendered Z slabs
- compound-arbor ratios

Changing any of those is a **new train**, not this project.

GLB root scale is `0.001` (source mm → glTF metres). Keep it.

## Coordinate system

- Units in spec space: millimetres
- `+X` = 3 o’clock, `+Y` = 12 o’clock, `+Z` toward the dial
- Center arbor stays at XY `(0, 0)` — that is the hands axis

### Required product orientation

The vendor file is stored in spec orientation (fourth arbor near +Y / 12).

**This watch uses a +180° rotation around +Z at the origin** so the fourth arbor (seconds) sits at 6 o’clock.

- Implement rotation on a **wrapper group**, not by editing pose nodes inside the vendor asset.
- Provide a debug toggle: spec `0°` vs product `180°`.
- Default the viewer to `180°`.

Do not pick a third angle.

## What B0 / B1 may create

Allowed:

- repo config (`package.json`, Vite, TS)
- `src/**` viewer
- `public/` if needed
- docs you were asked for
- the check script (you may fix bugs in `scripts/`, not in vendor)

Forbidden in B0 / B1:

- case, lugs, crown, strap, dial, indices, hands (except a later burst)
- plates, bridges, jewels, pallet, balance, hairspring
- extra wheels / motion work
- exploded-view rigs
- substituting a different GLB
- “improving” tooth meshes so they look nicer in the viewer

## Hands / layout facts (for later — do not build now)

- Center arbor = minutes (hours will need motion work later)
- Fourth arbor = small seconds, at 6 after 180°
- No date window on v1
- No central seconds on v1
- No extra going-train pairs

## Naming

Working name: **Nocturne 40**.
Do not call a derivative asset “RC1”.
Do not publish the vendor core.
