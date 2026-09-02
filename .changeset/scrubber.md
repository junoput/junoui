---
'@junoput01/junoui': minor
---

New component: `.juno-scrubber` — timeline / transport (X6, `20260829-026`).

A track with a playhead, a **loaded** range distinct from the **played** one, optional in/out marks, chapter ticks, and a preview slot the app fills. For media playback, telemetry and session replay, audio editing, animation timelines.

Not `.juno-slider`: a slider is a single-value form control whose value is a number. A scrubber has three ranges over one axis, announces a **time**, and its playhead is dragged rather than nudged.

**The announcement is the contract.** `role="slider"` announces `aria-valuenow`, so a screen reader says "87" for a position in a three-minute clip. `junoui/scrubber` exports `valueText(87, 212)` → `"1:27 of 3:32"`, and `formatTime` drops the hour below an hour and clamps negative or non-finite input to `0:00` — a screen reader will read `-1:-5` aloud.

**The hit area is why this exists as much as the ARIA is.** A 4px track is unhittable with a finger. The **host** carries `--juno-size-tap-min` on the block axis and the track is painted inside it, so the component never mentions a phone. The in/out marks are separate controls and carry the floor **on both axes** — that is `20260815-040` stated as a rule rather than repeated: pagination held the floor on one axis and shipped at 44×32.

The floor is on the host rather than a pseudo-element so that `getBoundingClientRect` measures what a finger hits. `.juno-splitter` puts its hit area on `::after`, which leaves its measured box a 1px hairline — filed as `20260902-014`, with the measurement.

`touch-action: none` overrides the generated touch layer's `manipulation`, which would leave the browser free to claim a horizontal pan so a scrub on a phone scrolls the page.

`junoui/scrubber` is stateless — arrows step, PageUp/PageDown page, Home/End reach the ends exactly, any other key is left alone — and dispatches `juno-scrubber-seek` rather than writing `aria-valuenow`, because whether a seek lands is a question only the player can answer.
