# Validation (no pstack)

## Automatic (every burst)

From repo root:

```sh
node scripts/check-core.mjs
```

Must print `OK` and exit 0.

The script checks:

- vendor files exist
- `CORE_SPEC.json` still lists the five arbors
- listed XY axes match the baked expected values (tolerance 1e-6 mm)
- GLB is present and non-empty
- optional: named pose nodes exist if `@gltf-transform/core` or similar can parse; if not, file-level checks are enough for B1

If someone edited vendor files, `git diff -- vendor` will also be dirty. That is a fail.

## Human / second-model audit (optional, after a burst)

Paste this to Claude or ChatGPT with the diff:

```text
You are auditing a watch repo. CONSTRAINTS.md is law.
Vendor path vendor/going-train-core-v1/ must be untouched.
This burst was B0+B1 only (viewer + 180° wrapper + check script).

Tell me:
1. Did any vendor file change?
2. Did they rotate pose nodes instead of a wrapper?
3. Did they start case/dial/hands/plates?
4. Is the default view 180° around Z?
5. What should be fixed before the next burst?

Repo rules are attached. Diff is attached.
```

Attach `CONSTRAINTS.md` + `git diff` + check-script output.

## Design review (this Grok chat)

Send a screenshot of the viewer (spec 0° and product 180°) plus whether `npm run check` passed.
