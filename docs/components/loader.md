# Loaders (arc · beacon · linear)

Three progress indicators, each in an **indeterminate** form (loops on its own,
CSS only) and a **determinate** form (tracks real progress).

## Progress API

Determinate variants read `--juno-progress` (0–100). Set it inline or from JS:

```js
el.style.setProperty('--juno-progress', 63);
```

Color comes from `--juno-role` (default `active`); add a `.juno--<role>` class to recolor.

## Arc — circular ring

```html
<!-- indeterminate -->
<div class="juno-arc juno-arc--indeterminate"></div>

<!-- determinate (label as a sibling so the ring mask doesn't clip it) -->
<div style="position:relative;width:76px;height:76px;">
  <div class="juno-arc" style="--juno-progress:63;"></div>
  <span class="juno-arc__label">63%</span>
</div>
```

| Class / var                                         | Effect                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `.juno-arc`                                         | Ring; determinate sweep = progress (conic gradient + ring mask). |
| `.juno-arc--indeterminate`                          | 12-step mechanical rotation.                                     |
| `--juno-arc-size` (76px) · `--juno-arc-width` (4px) | Diameter / stroke.                                               |

> The ring uses a CSS mask, which clips children. Put `.juno-arc__label` as a
> **sibling** over a positioned wrapper, not inside `.juno-arc`.

## Beacon — radiating pulse

```html
<!-- indeterminate -->
<div class="juno-beacon"><span class="juno-beacon__core"></span></div>

<!-- determinate: fill grows centre → rim -->
<div class="juno-beacon juno-beacon--determinate" style="--juno-progress:63;">
  <span class="juno-beacon__track"></span>
  <span class="juno-beacon__fill"></span>
  <span class="juno-beacon__hub"></span>
  <span class="juno-beacon__label">63%</span>
</div>
```

| Part                                       | Role                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `.juno-beacon`                             | Container; emits two staggered pulse rings.     |
| `.juno-beacon__core`                       | Centre dot (indeterminate).                     |
| `.juno-beacon--determinate`                | Switches to a centre→rim fill mask by progress. |
| `__track` / `__fill` / `__hub` / `__label` | Ring track, growing fill, centre hub, readout.  |

## Linear — bar

```html
<!-- indeterminate -->
<div class="juno-bar juno-bar--indeterminate"><span class="juno-bar__fill"></span></div>

<!-- determinate -->
<div class="juno-bar" style="--juno-progress:63;"><span class="juno-bar__fill"></span></div>
```

| Class                      | Effect                                |
| -------------------------- | ------------------------------------- |
| `.juno-bar`                | Track (`s2`, 6px, radius `radius.3`). |
| `.juno-bar__fill`          | Fill; width = progress, color = role. |
| `.juno-bar--indeterminate` | A 40% segment slides across.          |

## Notes

- Indeterminate forms need no JS. All animations respect `prefers-reduced-motion`
  (slowed to near-static by the base layer).
- Use determinate whenever real progress is known — it reads as more trustworthy.
