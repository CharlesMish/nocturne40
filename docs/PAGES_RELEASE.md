# Pages release: preserve both watch studies

The owner approved the Precise Dress presentation at
`d72cda86d927277ccf6ce812117d05801f89efbe`. PR #2 merged normally as
`6a05bc0f2c222b4d4098caef72177f8c850e5e1e` on September 30, 2026.
This follow-up changes only publication packaging, labels, links and canonical
metadata. Neither renderer, model, material implementation nor vendor asset changes.

## Atomic publication layout

One Pages artifact contains both complete builds. Do not publish the current
presentation alone: its alternate link depends on the archived study being present.

| Path under `https://charlesmish.github.io/nocturne40/` | Meaning |
| --- | --- |
| `/` without a query | Opens `watch.html`, the reviewed Precise Dress presentation |
| `watch.html` | Precise Dress; Studio light and Original physical finish |
| `index.html?...` or `/?...` | Existing main technical viewer and query settings |
| `compare.html` | Existing main design comparisons |
| `studies/astra-8f55172/` | Pinned Arc / Flow presentation, with its original geometry |
| `studies/astra-8f55172/viewer.html?...` | Pinned Astra technical viewer |
| `viewer.html?...#...` | Redirects old public Astra technical URLs, preserving query and hash |
| `deployment-manifest.json` | Exact source refs and SHA-256 hashes for deployed files |

Precise Dress has canonical `watch.html`; both archived presentation aliases have
canonical `studies/astra-8f55172/`. The archived header labels the study on desktop
and mobile, links the immutable Astra source pin, and offers a Precise Dress return
link. The old models and branches remain untouched.

## Build and verify

The workflow reuses the existing checkout, Node 24, Pages artifact and deploy
actions, the `github-pages` environment, `DEPLOY_PAGES` variable, and Pages
concurrency group. Pull requests build only; only main can deploy.

1. Check out Astra `8f55172b4a81ebc157fab409ae1d8c9ac5e31212` separately.
2. In that checkout, run `npm ci`, `npm run check`, `npx tsc --noEmit`, and
   `npm run build:pages`.
3. In the current checkout, run `npm ci`, `npm run check`, and
   `npm run build:pages -- /absolute/path/to/astra-checkout`.
4. Serve `dist` at a subdirectory and inspect both presentations, all presets,
   both current finishes, their return links, and the technical routes above.

Packaging fails if Astra's source pin or any of the five previously verified
public asset hashes differs. Only archived presentation HTML receives new labels,
canonical metadata and navigation. Its JavaScript and train asset stay byte-for-byte
identical. The archive's complete output is copied, not selectively recreated.

## Deployment gate (observed September 30)

The existing `github-pages` environment has one permitted deployment branch:
`astra/exploration` (policy ID `59272530`). Main is not permitted. The environment
policy and all security, DNS and credential settings were left unchanged.

Before merging this release workflow, obtain approval to add `main` to that
environment's branch allow-list. Keep the existing Astra rule; no wildcard or
bypass is needed. Then use normal PR checks and merge, and verify the actual
deployment's manifest, routes, controls and screenshots. Do not claim this package
is live while that gate remains unresolved.

The historical Astra workflow still exists on its untouched branch. A future
push or manual run there can republish its older root-only artifact. Avoid
dispatching that historical workflow during or after this release.

No custom-domain change is included. `nocturne40.cmish.dev` did not resolve during
the review; the existing GitHub Pages URL is the verified hosting destination.
