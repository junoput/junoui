---
'@junoput01/junoui': minor
---

`junoui-doctor` reports controls that occupy space and cannot be seen or pressed, and the kit states what a green run does not mean.

`shown()` was `display !== 'none'` plus a non-empty rect — which is "occupies space", not "is visible". A control could be exactly 44 × 44, in the right place, and invisible. Three causes are now reported as their own finding, separate from a short target because they are a different question with a different fix: `visibility: hidden`/`collapse` and `opacity: 0` (on the element or any ancestor), and **being covered by something else** at its own centre point. Navigation presence uses the same test, so a dock buried under an overlay is no longer counted as navigation.

An overlay with `pointer-events: none` is deliberately **not** reported — it is not between the finger and the control, and flagging it would make the probe noisy on every app with a decorative scrim.

New `docs/appearance.md` lists, per check, what it asserts **and what it passes while the screen is wrong**. Every check in this kit is geometry, presence or text; none reads the picture, and a correctly-structured page that renders wrong passes all of them. That is not a defect in the checks — it is what a check of this kind is — but the kit's pitch invites the opposite reading, so it is now stated where a consumer will meet it, and pinned by a test in both places that make the admission.
