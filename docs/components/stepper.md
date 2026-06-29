# Stepper

A sequence of steps with numbered markers and connectors that shows progress through a
multi-step flow. Each step carries `data-state` — `complete` · `current` · `upcoming`;
the active one gets `aria-current="step"`. Built on a real `<ol>`; the app sets the
states. Zero JS. Reads `--juno-role` (default `active`) for the accent.

## Web

```html
<ol class="juno-stepper">
  <li class="juno-stepper__step" data-state="complete">
    <span class="juno-stepper__marker">
      <svg class="juno-icon juno-icon--sm" aria-hidden="true"><use href="…#juno-i-check" /></svg>
    </span>
    <span class="juno-stepper__label">Plan</span>
  </li>
  <li class="juno-stepper__step" data-state="current" aria-current="step">
    <span class="juno-stepper__marker">2</span>
    <span class="juno-stepper__label">Build</span>
  </li>
  <li class="juno-stepper__step" data-state="upcoming">
    <span class="juno-stepper__marker">3</span>
    <span class="juno-stepper__label">Ship</span>
  </li>
</ol>
```

| Part / attr               | Effect                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `.juno-stepper`           | `<ol>` row; `--juno-stepper-marker` sizes the circle.       |
| `.juno-stepper__step`     | One step; set `data-state` + connector lights when reached. |
| `.juno-stepper__marker`   | Numbered circle (or a `check` icon when complete).          |
| `.juno-stepper__label`    | Step caption.                                               |
| `data-state="complete"`   | Filled accent marker + lit connector.                       |
| `data-state="current"`    | Ringed accent marker; pair with `aria-current="step"`.      |
| `data-state="upcoming"`   | Muted marker + connector.                                   |
| `.juno-stepper--vertical` | Stack steps; connector runs down the marker column.         |

## Usage

- Set `aria-current="step"` on the current step so assistive tech announces position.
- The **state drives the color**, not vice-versa — `complete` and `current` both light
  the accent + their incoming connector; `upcoming` stays muted.
- Use a `check` icon for completed markers, the number for current / upcoming.
- Change the accent with a role class on `.juno-stepper` (e.g. `.juno--nominal`).
