---
'@junoput01/junoui': minor
---

Consumer-driven improvements (from the buzz chat-app integration):

- **Fonts self-hosted, CSP-safe.** `base.css` no longer fetches Google Fonts
  cross-origin (broke strict CSP, phoned home). B612/B612 Mono ship as woff2 with
  a local `@font-face` sheet, opt-in via `import 'junoui/fonts.css'` (not bundled
  into `juno.css`). **Behavior change:** consumers that relied on junoui pulling the
  font now get a system fallback until they import `junoui/fonts.css` or load B612
  themselves.
- **Neutral ramp extended:** new `--juno-data-dim` (faint metadata — timestamps,
  tick labels) and `--juno-border-strong` (divider heavier than the hairline
  border), across all three palettes × both modes and every platform output.
- **Integration guide** (`docs/integration.md`): import order for app shells, the
  token-bridge recipe, fonts opt-in, "accent is semantic (not a brand hue)", and the
  extension/palette policy.
