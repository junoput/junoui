---
'@junoput01/junoui': patch
---

**Tap-target assertions measure the page's own specimens, not the showcase chrome.**

A tap-target test passed with the rule it was written to check deleted from the bundle: 24px off the built bundle, 44px off `/showcase/buttons.html`, same markup, same emulation. The cause was not a stylesheet override — the two were never looking at the same element. `app.js` injects the showcase's own phone chrome around each page, `.juno-navbar__actions > *` carries `min-block-size: var(--juno-size-tap-min)`, and a `.first()` locator therefore picked a chrome button that is 44px for a reason unrelated to the rule under test.

Every showcase locator is now scoped to `main`. Scoping is not self-guarding — removing it leaves all the assertions green, because the chrome button satisfies them — so there is a separate check that the helper stayed scoped and that no assertion reaches for a bare junoui class.

Test-only; no consumer-facing change.
