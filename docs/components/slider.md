# Slider

A throttle-quadrant lever: a detented channel with a gripped lever. Native
`<input type="range">` — keyboard + screen-reader support for free.

## Web

```html
<input class="juno-slider" type="range" min="0" max="100" value="60" />
<input class="juno-slider juno--target" type="range" min="10" max="320" value="160" />
```

| Class           | Effect                                                   |
| --------------- | -------------------------------------------------------- |
| `.juno-slider`  | Full-width range; detented `s0` channel + gripped lever. |
| `.juno--<role>` | Tints the filled portion (default `active`).             |
| `:disabled`     | Dimmed by `opacity.disabled`, not-allowed.               |

## Anatomy (any platform)

- Channel `space.20`, `control-edge` border, inset shadow, faint detents every 10%.
  Lever `space.10` × `space.28`, gradient `s3`→`s2`. Full hit height `size.tap.min`.
- Filled portion is role-tinted (Firefox `::-moz-range-progress`; on WebKit the role
  shows via the paired value readout). Focus uses the base ring.

## Usage

- Pair with a mono readout (`.juno-value` / `.juno-mono`) of the current value.
- The app owns `min`/`max`/`value` and `aria-valuetext` when the number needs units.
