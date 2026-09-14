---
'@junoput01/junoui': patch
---

**`docs/safe-area.md` now names which env() bucket each component uses.** It
previously documented the arithmetic (edge padding / clearance / floating
chrome) without saying which component reads which, so a consumer had to read
the CSS to find out — filed after nexora took the additive form for
`.juno-dock--pill` assuming it was the only option (20260909-126, override A).

Also documents a fourth shape the original three buckets did not cover:
**available-space cap**, a term subtracted from how much room exists rather
than a distance from an edge — the pillbar's `max-inline-size` uses it
alongside its floating-chrome offset, and restating one does nothing to the
other. Docs only, no CSS behaviour change.
