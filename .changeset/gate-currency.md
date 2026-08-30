---
'@junoput01/junoui': patch
---

**The consumer gate now checks that its consumer is still the consumer.**

`gate:consumer` claims a candidate "compiles into an app that consumes it". It checks out a _lane_ by default (`ios/develop`), and a lane drifts: on 2026-08-26 it reported GATE GREEN twice against a nexora `ios/develop` that was **260 commits behind its own develop**, on which the guard that would have failed did not yet exist. The gate proved something true and much weaker than the sentence `RELEASING.md` uses to justify it.

New stage, the same shape junoui already runs on itself one section up: assert the checked-out branch has taken its baseline back. `--baseline` (default `develop`) and `--no-baseline-check` for a consumer that genuinely has no baseline.

It **fails closed**: if shallow history cannot support the comparison, that is not an answer and the stage is red, because a gate that cannot tell whether its consumer is current is the gate this replaces.

Internal to the release process; no consumer-facing change.
