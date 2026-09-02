# What "plug and play" means on iOS, exactly

junoui claims to handle iOS-Safari and PWA form: safe areas, tap targets,
momentum scroll, standalone chrome. This states what that buys, what you still
have to supply, and what it explicitly does not do (`20260805-020`).

It is deliberately three lists, not one. A claim with no boundary is the kind
that gets believed until a phone disproves it, and every row below points at
something that runs — a token in the shipped build, or a test — rather than at a
sentence.

## What you get by loading the stylesheet

| You get                                   | Because                                                                                                                          | Checked by                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 44px tap targets on touch                 | `--juno-size-tap-min` promotes to `--juno-size-tap-comfortable` under `@media (pointer: coarse)`, and every control sizes off it | `test/visual/tap-targets.spec.mjs`, per project                |
| …on **both axes**                         | components floor block **and** inline size; a one-axis floor is the `20260815-040` defect                                        | `test/visual/scrubber.spec.mjs` + `test/visual/range.spec.mjs` |
| No iOS focus-zoom on text entry           | `font-size: max(16px, …)` on `.juno-input` under coarse                                                                          | `test/visual/tap-targets.spec.mjs`                             |
| Safe areas honoured                       | four `--juno-safe-*` seams; **no rule calls `env()` directly**                                                                   | `test/safe-area.test.mjs`                                      |
| A letterboxed standalone window corrected | `html[data-juno-letterboxed]` zeroes the bottom inset only                                                                       | `test/safe-area.test.mjs`                                      |
| Momentum scroll that does not chain       | `overscroll-behavior: contain` on scrollers                                                                                      | `test/plug-and-play.test.mjs`                                  |
| No tap-highlight flash                    | suppressed on every registered touch surface                                                                                     | `test/plug-and-play.test.mjs`                                  |
| Phone navigation that survives landscape  | `(pointer: coarse) and ((width ≤ 767.98px) or (height ≤ 500px))`                                                                 | `test/pointer-first.test.mjs`                                  |

## What you must supply

junoui cannot do these from a stylesheet. If you skip them the CSS above is
partly or wholly inert.

1. **`<meta name="viewport" … viewport-fit=cover>`.** iOS defaults to `contain`,
   and **every safe-area inset reads 0 without this** — so the safe-area work
   above silently does nothing. See `docs/getting-started.md`.
2. **Detecting the letterbox and setting `data-juno-letterboxed`.** junoui ships
   the _correction_, not the detection: whether a standalone window is
   letterboxed is a measurement of your window, and only the app can take it.
3. **Your own values.** Every stateful primitive — scrubber, range, splitter,
   tree, gizmo — takes the numbers from you and emits a request. junoui never
   writes `aria-valuenow`.
4. **A device pass.** See below.

## What junoui explicitly does not do

- **It does not test WebKit.** Every automated check here is Chromium. This
  org's worst layout bugs have lived on iOS Safari, and the letterbox itself was
  found on a device and reproduced with a hand-built testbed, not by CI.
- **It does not make your app conformant.** It ships primitives with the floors
  built in; composing them wrongly is still wrong, which is what
  `junoui-doctor` is for — run it against _your_ app.
- **It does not see what you paint.** Every check is geometry, presence or text;
  a correctly-structured page that renders wrong passes all of them. See
  [appearance.md](./appearance.md).
- **It does not reach UI you draw** into a canvas or a GPU frame. See
  [painted-ui.md](./painted-ui.md).
- **It does not own gestures.** `.juno-gesture-surface` clears the UA's way; the
  recognizer is yours.

## How the claim is kept honest across a release

A junoui release is changesets + CI + publish, and none of that builds the app
that consumes it. `npm run gate:consumer` does: it packs the release candidate,
checks the consumer out, installs the candidate, and runs the consumer's **own**
guards against it — `tsc --noEmit`, `npm test`, `npm run build`. Nexora's suite
includes `viewportFit.test.ts`, which reads the **consumed** junoui build rather
than a remembered copy.

That is what turns "plug and play" from a claim into a thing that fails a
release. It has already done so: the safe-area seam went red on nexora's
`pillbarHeight.test.ts` before it shipped.

**The device pass is not automated and is not going to be.** Anything touching
viewport, safe area, or overlays gets looked at on a real phone before release.
`docs/ios-conformance.md` records what has actually been measured on hardware and
what is still community convention rather than an Apple statement.
