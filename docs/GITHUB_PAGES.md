# Presentation and GitHub Pages

Open `/watch.html` on the local Vite server. The layout gives the viewer about three quarters of the desktop content width and uses the available window height. The heading becomes compact on phones. The Three.js document cannot create its own scrollbars; very short windows or heavy browser zoom can still scroll the outer page to keep all controls accessible.

## Build and preview

```sh
npm ci
npm run check
npm run build:pages
npm run preview:pages
```

Open the preview server's root URL. The `dist-pages/` artifact contains:

- `index.html`: the public presentation, directly at the site's root.
- `watch.html`: the same presentation at its existing address.
- `viewer.html`: the Three.js viewer embedded by the presentation.
- `assets/`: the bundled code and model needed to render the watch.

Relative paths work at both a domain root and a project path such as `/nocturne40/`. The local comparison pages and `.review/` files are excluded from this artifact. Ordinary `npm run dev` and `npm run build` retain the existing local viewer and comparison routes.

## Enable hosting later

The workflow in `.github/workflows/pages.yml` builds and uploads the site on pushes to `astra/exploration`. Publishing stays off while the repository variable `DEPLOY_PAGES` is absent or not equal to `true`.

When ready to publish:

1. In [repository Pages settings](https://github.com/CharlesMish/nocturne40/settings/pages), set **Build and deployment → Source → GitHub Actions**.
2. In [repository environment settings](https://github.com/CharlesMish/nocturne40/settings/environments), make sure the `github-pages` environment allows deployment from **`astra/exploration`**. Add that branch to its allowed deployment branches if necessary.
3. In [Actions variables](https://github.com/CharlesMish/nocturne40/settings/variables/actions), create the repository variable **`DEPLOY_PAGES`** with value **`true`**.
4. Push the next update to `astra/exploration`. In **Actions → Build watch / GitHub Pages**, confirm that both the build and deploy jobs succeed.

The expected public address is `https://charlesmish.github.io/nocturne40/`. It becomes live only after a successful deployment. GitHub also reports the actual URL on the deployment and in Pages settings.

The workflow publishes the exploration branch, so the frozen `main` baseline does not need to change. It uses GitHub's built-in token and Pages artifact deployment; no personal access token or separate hosting branch is needed. Setting `DEPLOY_PAGES` to `false` pauses future deployments, but does not unpublish an already deployed site.

This setup follows [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
