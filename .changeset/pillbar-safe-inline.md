---
'@junoput01/junoui': patch
---

Fix: the corner pillbar's width cap now sheds the horizontal safe-area insets.
`max-inline-size` was `calc(100% - 2 * edge)`, and for the `position: fixed`
corner variants `100%` is the viewport — which spans under the sensor housing in
landscape. The variants already shed the inset when POSITIONING themselves, so
the pill's anchored edge landed correctly and it grew off-screen in the other
direction: measured at 844x390 with 59px insets, the pill's left edge sat at
**-39px**. Found by nexora, which carries an override for it.

Visible only on a notched device held sideways; `env()` is 0 everywhere else, so
this changes nothing on any display without insets.
