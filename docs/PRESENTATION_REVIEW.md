# Presentation review - September 30, 2026

## Finding and reproduction

The September 28 merge did not replace the richer public study. `main` and the
published Astra branch diverged from the same accepted design. Main's empty URL
opened its historical technical viewer; its documented accepted model and new
studio finish were already accessible through query parameters.

- Accepted ancestor: `154cb513f09bca22b004cda00233da799ce9b5a0`.
- Main before this candidate: `cda7c7dc84f5234ce3a2ba5ae6110d192c68a1ad`.
- Merged lighting branch: `1786114312d24b8cd019d4d63ef18bb47e8ca554`
  (`claude/watch-lighting-hands-mf0vqi`, PR #1). The merge adds studio reflections, steel
  and blued-hand materials plus hand normals, not a new train.
- Published Astra: `8f55172b4a81ebc157fab409ae1d8c9ac5e31212`.
- Successful Pages run: <https://github.com/CharlesMish/nocturne40/actions/runs/34152159947>.
- Existing public presentation: <https://charlesmish.github.io/nocturne40/>.
- <https://cmish.dev/projects/nocturne40> links that public presentation and
  `astra/exploration`, with Arc / Flow copy.
- `https://nocturne40.cmish.dev/` failed DNS resolution in both the in-app browser
  and a direct HTTP client. Pages metadata has no custom domain. No DNS changes
  were attempted.

Reproduce the old main views at the main pin with `npm ci && npm run dev`:

```text
/
/?design=synthesis&finish=physical2&view=oblique&light=neutral&pose=ten-ten
/?design=synthesis&finish=studio&view=oblique&light=neutral&pose=ten-ten
```

The candidate redirects only the empty query to `watch.html`. The old default
is still at `/?viewer=1`; all earlier parameterized viewer routes remain intact.

## Different models, shared train

| Line | Geometry | Presentation / finish |
| --- | --- | --- |
| Accepted ancestor / main `physical2` | Precise Dress / synthesis geometry and original strap construction | Accepted warm dial and physical finish |
| Main `studio` | Same positions, silhouettes and dimensions as main `physical2`; shading normals differ on hand blades | Strip reflection environment, steel response and oxide-film approximation for blued hands |
| Astra public study | Curved Arc case, Flow lugs, refined hardware, complete closed strap, revised seconds lip, and socketed center extension / concentric hour sleeve / seated collet and cap | Atelier dial grain and blue-metal appearance; responsive presentation shell |

Astra's hand-stack connection is additional geometry. It is not complete hour
reduction or setting/friction machinery. Main's later merge does not contain
that connection. The train asset is identical in both branches and in the live
deployment. Neither model should silently replace the other.

## Exact deployed bytes

Building `8f55172` with its lockfile (`npm ci && npm run build:pages`) reproduces
the following live files byte-for-byte, including SHA-256 values:

| Live file | SHA-256 |
| --- | --- |
| `index.html` | `32351e58cd6a92182d7bb38eebcb7f4d8b7bfafdfce81ca30074b050ee1346cc` |
| `viewer.html` | `ddc54dc72ef344c1beeef27deb9f143cbb7ab167ed6e4fcea5f911debe4408e8` |
| `assets/presentation-CrM3bTn7.js` | `2921313d07ce8d617acdafd22238ad4f85b14ccaa0bc14b30e05f68fb70ce03c` |
| `assets/viewer-BqNn1SkP.js` | `261fe6d3ae73c1737f9ef5bead2616dd48136310b199ecd16c04f09b5e74cab5` |
| `assets/going-train-core-C-HMDpPG.glb` | `e8c950e5d89df308aa30fe978254320952dea10f8bf2bec72f22f65e88437b6b` |

The live iframe uses:

```text
viewer.html?design=synthesis&finish=physical2&exploration=arc&lug=flow&refinement=finish&strap=complete&strapPose=closed&size=170&surface=atelier&view=oblique&light=neutral&pose=ten-ten&embed=1&presentation=1
```

## Bounded candidate

Adapt the Astra shell's visual language around main's existing model, with five
existing view presets, a finish selector, shareable view/finish URLs, and a
clearly described link to the already-public alternative. Keep source pins and
technical routes in the Sources & inspection disclosure. This avoids bundling a
second rendering codebase or merging competing geometry/material work.

Only the embedded presentation suppresses the hidden keyboard study shortcuts.
The direct technical viewer keeps them. No vendor, model, material or lighting
implementation changes are included. The whole public presentation is not a
controlled material comparison: model, camera framing and finish differ.

## Publication boundary

At inspection, the repository had one workflow, present only on Astra:
`.github/workflows/pages.yml`. It triggers on pushes to `astra/exploration` or
manual dispatch. Its deployment requires that exact branch and `DEPLOY_PAGES`
equal to `true` (currently enabled). There is no PR event, no workflow on main or
this candidate, no repository webhook, and no main check/status preview provider.
A new `codex/presentation-review` branch is therefore not expected to publish.

Do not push to Astra, merge main, dispatch Pages, change DNS, or publish a new
preview as part of this review. Existing public links are sufficient to inspect
the richer alternative. The candidate stays local until publication is approved.

## Validation

Use the locked dependencies, then `npm run check` (must print `OK`),
`npm run build` (includes TypeScript), and `git diff --check`.
Inspect all five view buttons and both finishes; confirm the selected state,
URL and technical link agree, reload preserves the choice, the iframe reports
ready, and hidden study shortcuts do not mutate the presentation.
Check the historical default, accepted physical2 and compare routes directly.
Check desktop and phone widths, including scrolling to source links.

Production preview must also work under a subdirectory with the relative build
base. Screenshot evidence is kept outside tracked source and delivered with the
review. Existing dependency-audit notices and the large Three.js bundle warning
are outside this presentation-only change.

### Observed results for this candidate

- Core authority check printed `OK`; TypeScript, production build and whitespace
  checks passed. Model/material files and the entire vendor tree have zero diff
  against `cda7c7d`.
- All five presentation presets changed the rendered view. Both finishes loaded,
  including switching on a 390 x 844 CSS-pixel phone viewport. View selections
  persisted on reload and the technical link tracked the selected view/finish.
- Desktop production preview at 1280 x 720 had no document overflow. The phone
  layout had no horizontal overflow and used ordinary vertical scrolling to
  expose the source disclosure. The existing public study was also inspected
  inside a 390 x 844 responsive frame; this is not physical touch-device testing.
- The production artifact loaded from `/nocturne40/`, including its model and
  controls; the historical query route and comparison page remained accessible.
- Keyboard dispatch to the WebGL iframe timed out in the in-app browser, so the
  new presentation shortcut guard has source review only, not completed
  end-to-end keyboard/gesture validation. One unattributed `MutationObserver`
  error appeared in the browser log during root navigation even though the
  watch reported ready and rendered. Do not claim an entirely clean console.
