# Slider

A native `<input type="range">` tinted with the role via `accent-color`. Native =
keyboard + screen-reader support for free.

## Web

```html
<input class="juno-slider" type="range" min="0" max="100" value="60" />
<input class="juno-slider juno--target" type="range" min="0" max="100" value="80" />
```

| Class           | Effect                                                         |
| --------------- | -------------------------------------------------------------- |
| `.juno-slider`  | Full-width range; `accent-color` = role (default `active`).    |
| `.juno--<role>` | Recolors track + thumb (e.g. `target` for a managed setpoint). |
| `:disabled`     | Dimmed by `opacity.disabled`, not-allowed.                     |

## Anatomy (any platform)

- Full inline-size; hit height `size.tap.min`. Track + thumb = `--juno-role`.
- Focus uses the base outline ring.

## Usage

- Pair with a mono readout of the current value (`.juno-value` / `.juno-mono`).
- The app owns `min`/`max`/`value` and `aria-valuetext` if the raw number needs units.
