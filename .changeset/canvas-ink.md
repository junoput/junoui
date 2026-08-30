---
'@junoput01/junoui': minor
---

**Canvas ink — a halo pair for UI drawn over arbitrary imagery.**

junoui's contrast story assumes a controlled surface, `s0` through `s3`: every role colour's ratio is computed against a known background. Content drawn over a photo, a map, a video frame or a camera feed has no known background — in one orthophoto a black shadow and a snowfield are adjacent pixels, so no single ink colour is legible and no contrast ratio can be asserted about one.

New `ink.canvas.ink` / `ink.canvas.halo`: a pair that spans the luminance range, applied together. Over a light backing the halo carries the contrast, over a dark one the ink does. Plus `ink.vivid.*` (role hues at raised chroma, since chrome-tuned hues wash out over a saturated backdrop) and `ink.canvas.scrim` (`0.28`, for chrome floating over live content — deliberately distinct from `opacity.scrim` at `0.62`, which suppresses a modal's background and here would grey out the content being annotated).

Shipped as CSS you can apply, not only as tokens: `.juno-canvas-ink` (+ `--lg` and the role modifiers), `.juno-canvas-ink__halo` / `__stroke` for vector marks, and `.juno-canvas-scrim` with a reduced-transparency fallback. Every platform target carries the tokens — CSS, SCSS, JS, Swift, Dart, Android and Rust.

**The pair is not themed**, on purpose: a satellite image does not get lighter because the user chose light mode.

**The halo is pure black because the arithmetic requires it.** The worst backing is a mid grey where both halves are weakest; the sweep floor there is 4.61:1 against a 4.5:1 requirement, and a near-black with a blue cast measures 4.43:1 and fails. The guard sweeps all 256 grey backings rather than sampling the extremes, which are the easy cases.

Additive: no existing token or output changes.
