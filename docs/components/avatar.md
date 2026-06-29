# Avatar

A round (or squared) portrait holding an `<img>`, **initials**, or an
[icon](./icon.md) fallback. One custom property drives the size; an optional role ring
marks status. Zero JS. Pairs with a [`.juno-skeleton--circle`](./skeleton.md) while the
image loads.

## Web

```html
<!-- image -->
<span class="juno-avatar"><img src="ada.jpg" alt="Ada Lovelace" /></span>

<!-- initials -->
<span class="juno-avatar juno-avatar--lg">AL</span>

<!-- icon fallback + status ring -->
<span class="juno-avatar juno-avatar--ring juno--nominal" title="Online">
  <svg class="juno-icon" aria-hidden="true"><use href="…#juno-i-user" /></svg>
</span>

<!-- overlapping cluster -->
<span class="juno-avatar-group">
  <span class="juno-avatar"><img src="a.jpg" alt="Ada" /></span>
  <span class="juno-avatar"><img src="g.jpg" alt="Grace" /></span>
  <span class="juno-avatar">+3</span>
</span>
```

| Class                    | Effect                                                      |
| ------------------------ | ----------------------------------------------------------- |
| `.juno-avatar`           | Circle portrait; `--juno-avatar-size` (default `space.32`). |
| `.juno-avatar--sm/lg/xl` | `space.24` / `space.40` / `space.56`.                       |
| `.juno-avatar--square`   | Rounded-rect instead of circle.                             |
| `.juno-avatar--ring`     | Status ring in `var(--juno-role)` (+ soft halo).            |
| `.juno-avatar-group`     | Overlapping row; each tucks under the previous.             |
| `--juno-avatar-size`     | Override the size (initials scale to ~40% of it).           |

## Usage

- An `<img>` fills the box (`object-fit: cover`); always set a meaningful `alt`.
- Initials / `+N` overflow are plain text content — center-aligned, uppercase.
- The **ring is decorative**: pair it with a `title` / visible label so status isn't
  color-only.
- In a group, set `alt` per avatar; the trailing `+N` chip is just another avatar.
