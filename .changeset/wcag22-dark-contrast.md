---
'junoui': major
---

WCAG 2.2 contrast audit — dark-mode surface separation + verified AA/AAA claims.

Full measured audit added (`scripts/audit-contrast.mjs`, run with `node`) covering every
text / status / non-text pair across `standard` · `soft` · `colorblind` × dark · light.
It surfaced three gaps, now fixed:

- **Dark `label` failed AA on the `s3` (selected/overlay) surface** (≈ 4.0:1). Lifted
  dark `label` to `oklch(63% …)` across all three palettes so secondary text now clears
  **1.4.3** Contrast (Minimum), AA (≥ 4.5:1) on **every** surface `s0`–`s3` (≈ 4.6–5.9:1),
  data > label > muted hierarchy preserved.
- **Dark blocks were imperceptible against the background.** Adjacent surface fills
  differ by only ~1.05:1, and the old dark `border`/`border-strong` sat at 1.2:1/1.7:1 vs
  the base surface — cards, panels and dividers had no visible edge. Lifted dark `border`
  and `border-strong` (standard/colorblind → 30% / 40%, soft → 31% / 41%) to ≈ 1.5:1 /
  2.2:1: a quiet-but-visible hairline. (Container boundaries are decorative and exempt
  from **1.4.11**; component-identifying edges already use `--juno-control-edge*`.)
- **Colorblind AAA claim was overstated on `s3`** (≈ 6.97:1). Docs corrected: colorblind
  status roles meet **1.4.6** AAA on `s0`–`s2`, AA on `s3` — matching how the `data` AAA
  claim is already surface-scoped. Carbon role hues are unchanged (colorblind-safety).

`docs/accessibility.md` Color section rewritten to state the measured, surface-scoped
guarantees and to mark `muted`/`data-dim` as decorative / WCAG-exempt roles.

**Breaking:** dark `--juno-color-*-label`, `-border`, `-border-strong` values change
across `standard`, `soft`, and `colorblind`. Visual only; no API/class changes.
