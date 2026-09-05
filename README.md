# Nocturne 40 - accepted design baseline

The accepted design uses the selected warm dial and the second physical-finish pass.

```sh
npm install
npm run check
npm run dev
```

Open the Vite URL with:

```text
/?design=synthesis&finish=physical2&view=oblique&light=neutral&pose=ten-ten
```

Add `&environment=bright` for neutral inspection. The bare URL intentionally retains the historical viewer default; it is not the accepted design shown above.

See [strap construction and validation](docs/STRAP_CONSTRUCTION.md) for the final pass and preserved design decisions. The vendor train remains unchanged. Local `.review/` galleries and `PROGRESS.md` are excluded from Git; the source regenerates the live model, but saved review screenshots are local artifacts.

## Exploration branch

Open `/explore.html` for a live comparison of the accepted watch and the first Arc study. See [Astra exploration notes](docs/ASTRA_EXPLORATION.md). The accepted baseline remains commit `154cb51` on `main`; the study is opt-in and does not touch the vendor train.

## Historical starter instructions

# Nocturne 40 — Cursor starter (B0 + B1 only)

This folder is the **first session** of a new watch built around a frozen going-train core.

You do **not** design the whole watch in this pass.
You do **not** install pstack.
You paste **one prompt** into Cursor Composer and stop when the checklist is green.

## What this watch is (one paragraph)

A closed dress watch. Cream dial, soft heat-blued hands, steel case, modestly **domed sapphire**, exhibition back. One small rose-gold accent (curiosity, not a two-tone watch). The certified five-arbor train stays read-only. Small seconds at 6 after a **180°** rotation around the center arbor.

## 15-minute setup (do this once)

1. Install [Cursor](https://cursor.com) if needed. Sign in. You do not need extra plugins.
2. Unzip this starter so you can see `README.md` at the repo root.
3. Unzip `watch-going-train-core-v1.zip` into:

   ```text
   vendor/going-train-core-v1/
   ```

   After that you should have:

   ```text
   vendor/going-train-core-v1/CORE_SPEC.json
   vendor/going-train-core-v1/assets/going-train-core.glb
   vendor/going-train-core-v1/INTEGRATION.md
   ```

4. In a terminal at the repo root:

   ```sh
   git init
   git add .
   git commit -m "baseline: starter + vendor core"
   ```

5. **File → Open Folder** on this repo (not your home directory, not the zip).
6. Open Composer / Agent (Cursor: `Cmd+I` / `Ctrl+I` is the usual chat; look for **Agent** or **Composer** if you want it to edit files).
7. Paste **only** the contents of `prompts/B0-B1.md`.
8. Let it work. If it asks to run `npm install` or the check script, allow that.
9. Stop when `scripts/check-core.mjs` prints `OK` and you can see the train in the browser.

Then come back here (or send the diff) for review. Do not start plates, case, or dial until that review.

## If Cursor feels loud

- Use **one** Agent/Composer chat. Do not open three.
- Model: Composer default, or Grok 4.6 if you see it. Do not swap mid-session.
- If it wants to edit anything under `vendor/`, say **no** and point it at `CONSTRAINTS.md`.
- If it stalls, say: `Stop designing. Finish B1 only. Run node scripts/check-core.mjs.`

## Layout

| Path | Why it exists |
|---|---|
| `CONSTRAINTS.md` | Frozen mechanical + product rules |
| `AGENTS.md` | Short rules Cursor should read |
| `docs/AESTHETIC.md` | Soft look (not a pixel spec) |
| `docs/VALIDATION.md` | What you (or Claude/ChatGPT) audit later |
| `prompts/B0-B1.md` | The only prompt for session one |
| `scripts/check-core.mjs` | “Did the five arbors move?” |
| `src/` | Empty-enough viewer stub |

`docs/LATER.md` is notes for bursts after review. Ignore it in session one.
