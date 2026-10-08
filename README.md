# Nocturne 40

An interactive dress-watch design study built around a frozen five-arbor going
train. The accepted design uses the selected warm dial and second physical-finish pass.

**[Open Precise Dress](https://charlesmish.github.io/nocturne40/)** ·
[Arc / Flow — preserved Astra study](https://charlesmish.github.io/nocturne40/studies/astra-8f55172/)

The bare local URL now opens `/watch.html`: a Precise Dress presentation around
the current model, with view buttons and the existing Studio light / Original
physical finish selector. It links the separately published Arc / Flow study
without importing that branch's geometry. See [presentation provenance and
review](docs/PRESENTATION_REVIEW.md) for exact refs, differences and validation.

## Run locally

Use Node.js 24 (the version used by the Pages workflow), npm, and a browser
with JavaScript and WebGL. From a checkout of this repository:

```sh
npm ci
npm run check
npm run dev
```

Open the Vite URL with:

```text
/?design=synthesis&finish=physical2&view=oblique&light=neutral&pose=ten-ten
```

Swap `finish=physical2` for `finish=studio` to see the lighting and hand-material pass on top of it:

```text
/?design=synthesis&finish=studio&view=oblique&light=neutral&pose=ten-ten
```

`studio` keeps everything in `physical2` and changes only light and material: a dim reflection room with long strip softboxes, polished steel at a realistic reflectance instead of the dark, capped grey that read as gunmetal, and blued hands as real metal with a thin-film (`iridescence`) oxide layer plus a shading-only crown across each blade. Hand outlines, case dimensions and the train are unchanged.

Add `&environment=bright` for neutral inspection. Existing query-based viewer URLs
retain their meaning; `/?viewer=1` recalls the historical viewer default. Build
with `npm run build`, then inspect locally with `npm run preview`.

For the complete Pages release, follow [publication and preserved studies](docs/PAGES_RELEASE.md).
It packages the current presentation and pinned Astra study together, preserving
the old public technical URLs. The published
[deployment manifest](https://charlesmish.github.io/nocturne40/deployment-manifest.json)
identifies the source refs and file hashes; the release document retains the
deployment gate observed during its September 30 review.

See [strap construction and validation](docs/STRAP_CONSTRUCTION.md) for the final pass and preserved design decisions. The vendor train's mechanical files remain unchanged. Local `.review/` galleries and `PROGRESS.md` are excluded from Git; the source regenerates the live model, but saved review screenshots are local artifacts.

## Contributing and repository guide

Read [CONSTRAINTS.md](CONSTRAINTS.md) and [AGENTS.md](AGENTS.md) before editing.
The vendor core is read-only: preserve its geometry, units, pivots, ratios and
mechanical evidence. Presentation work does not establish manufacturing readiness.
Use a focused branch from `main`, describe the scope and run `npm run check` and
`npm run build` before proposing a pull request. Later implementation requires
an explicitly scoped task; the inherited first-session guardrails still apply.

- [Presentation review](docs/PRESENTATION_REVIEW.md): accepted presentation and study identity.
- [Strap construction](docs/STRAP_CONSTRUCTION.md): design decisions and validation limits.
- [Development history](docs/DEVELOPMENT_HISTORY.md): starter prompts, design passes and original review records.

## License

CharlesMish's original software, watch design, rendered assets, and documentation,
including the bundled going-train core, are available under the [MIT License](LICENSE),
to the extent CharlesMish holds the rights to them. The core's
[PROJECT_RIGHTS.txt](vendor/going-train-core-v1/PROJECT_RIGHTS.txt) contains the
same MIT text. This replaces the previous owner-controlled rights restriction.

Third-party software retains its own licenses and copyright notices; preserve
the [core's third-party notices](vendor/going-train-core-v1/THIRD_PARTY_NOTICES.txt),
including Three.js, and the licenses supplied with other dependencies.

The core's rights notice, README, and package checksums were updated for this
licensing change. Its source, GLB, specifications, mechanical evidence, and
source-authority record remain unchanged. The mechanical freeze in
`CONSTRAINTS.md` is an engineering rule, not a restriction on the MIT grant.
