# Toggle button

An Airbus-style illuminated-legend pushbutton: the body stays dark; a top strip lights
(`nominal`) and the surround glows when engaged. A real `<button aria-pressed>`; the app
flips `aria-pressed`. Use for panel-style on/off controls where the lit legend matters.

## Web

```html
<button class="juno-toggle-btn" aria-pressed="true">
  <span class="juno-toggle-btn__strip"></span>
  <span class="juno-toggle-btn__row">
    <span class="juno-toggle-btn__text">
      <span class="juno-toggle-btn__legend">APU BLEED</span>
      <span class="juno-toggle-btn__desc">Auxiliary power air supply</span>
    </span>
    <span class="juno-toggle-btn__status">ON</span>
  </span>
</button>
```

| Class                                              | Effect                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `.juno-toggle-btn`                                 | Pushbutton tile on `control-surface`.               |
| `[aria-pressed="true"]`                            | Border → role, surround glow, strip + status light. |
| `.juno-toggle-btn__strip`                          | Top legend strip; `s3` (off) → role (on) with glow. |
| `.juno-toggle-btn__legend` / `__desc` / `__status` | Mono legend, sub-label, ON/OFF status.              |
| `.juno--<role>`                                    | Lit color (default `nominal`).                      |
| `:disabled`                                        | Dimmed, not-allowed.                                |

## Anatomy (any platform)

- Tile border `control-edge` → role when pressed, plus a 20% role outer glow. Strip
  `space.4` tall lights to role with an 8px glow. `motion.duration.quick` transitions.

## Usage

- A latching control whose engaged state must read at a glance (system arm/enable).
- Use a real `<button>` and keep `aria-pressed` in sync; for inline on/off in a form,
  prefer the [switch](./switch.md).
