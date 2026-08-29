# Agent rules (Nocturne 40)

Read `CONSTRAINTS.md` before any edit.

You are implementing **B0 + B1 only** unless a human paste says otherwise.

## Hard stops

- Never edit `vendor/going-train-core-v1/`.
- Never change gear geometry to make a screenshot prettier.
- Never start the case, dial, hands, or plates in this burst.
- If blocked, shrink scope. Do not invent a second architecture.

## First burst goal

1. Vite + Three.js viewer.
2. Load `vendor/going-train-core-v1/assets/going-train-core.glb`.
3. Keep named pivots: `barrel_pose`, `center_pose`, `third_pose`, `fourth_pose`, `escape_pose` (and nested `*_motion` if present).
4. Wrapper rotation: product default **180°** around Z; toggle 0° / 180°.
5. mm grid or axes so a human can see 12 at +Y in spec mode.
6. `node scripts/check-core.mjs` exits 0 and prints `OK`.

## Style of work

- Few files. No UI framework. No Tailwind-only-for-a-toggle.
- One HTML page, one entry script, maybe one `train.ts`.
- Prefer `three` + `vite`. Match the vendor’s millimetre mental model; remember GLB is in metres.

## When you think you are done

Run:

```sh
npm install
npm run check
npm run dev
```

`check` must pass. Then stop and write 5–10 lines in `PROGRESS.md` (create it) saying what you did and what you did not do.
