---
'@junoput01/junoui': minor
---

Mobile navigation kit — the tab + stack pattern, all CSS:

- `.juno-pillbar` — floating pill bar (the iOS-style alternative to the dock):
  2–5 icon destinations or actions in a translucent, blurred, fully-rounded
  capsule hovering above the bottom edge; sticky + safe-area cleared. Active
  styles off `aria-current` (links) / `aria-pressed` (toggles); optional
  `__sep` divider between groups.
- `.juno-navbar` — stack-navigation top bar: a back control **always on the
  start edge** (caret flips under RTL), centered truncating title, trailing
  actions; sticky, safe-area padded on top.
- `.juno-list` — grouped rows for vertical data organization (the settings
  pattern): uppercase group header over an `s1` card of hairline-divided rows;
  each row = leading icon + label/support + trailing value, control, or
  drill-in chevron. Interactive rows (`<a>`/`<button>`) get hover; static rows
  don't.
- Tab + stack shell recipe in `layout.md`: dock/pillbar switches sections,
  navbar backs out of pushed views, list rows do the drilling.
