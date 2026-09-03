---
'@junoput01/junoui': patch
---

State the iOS/PWA plug-and-play claim, and bound it (`20260805-020`).

The four areas in that promise — safe areas, tap targets, momentum scroll, standalone chrome — were mostly already shipping. What was missing was a statement of **what the claim covers and what it does not**, and any check that the promise matches the build.

`docs/plug-and-play.md` is three lists: what you get by loading the stylesheet, what you must supply, and what junoui explicitly does not do. Every row of the first list points at a token in the shipped build or a test that exists, not at a sentence.

The bounding lists are the substance. **What you must supply** leads with `viewport-fit=cover`, because every safe-area inset reads 0 without it — so the entire first table silently does nothing if it is missing. **What junoui does not do** keeps four boundaries that were each learned expensively: it does not test WebKit, it cannot see what you paint, it does not reach UI drawn into a canvas, and it does not make a consuming app conformant by composition.

`test/plug-and-play.test.mjs` holds the document to that: every promised mechanism is asserted against `dist/css/juno.css`, every cited guard must exist, and each of the four boundaries and the not-automated device pass must still be there.
