# junoui — build conventions

junoui is a **CSS-class design system** — there are no importable React components.
Build ordinary JSX elements and style them with `.juno-*` classes; every visual comes
from `styles.css` (tokens + fonts + all component styles). `window.Juno` holds design
tokens as JS constants plus the icon installer — nothing else.

## Required setup (nothing renders its colors without this)

All color variables are scoped to a palette attribute on the **root element**. Set it
once, before anything renders:

```js
document.documentElement.setAttribute('data-juno-palette', 'standard'); // standard | soft | colorblind
document.documentElement.setAttribute('data-juno-mode', 'dark');        // dark (canonical) | light; omit → follows OS scheme
```

Without `data-juno-palette` every surface/role variable is undefined and components
render as unstyled boxes. Dark is junoui's canonical look.

**Icons** ship as an injectable sprite. Call once at startup, then reference symbols
same-document:

```js
window.Juno.installJunoIcons(document);
```
```html
<svg class="juno-icon" aria-hidden="true"><use href="#juno-i-gear" /></svg>
```
(65 symbols, all prefixed `juno-i-`: gear, bell, user, folder, magnifying-glass,
check-circle, warning, info, hexagon, squares-four, funnel, dots-three, …)

## The styling idiom

- **Components are classes**: `.juno-btn`, `.juno-card`, `.juno-field`, `.juno-input`,
  `.juno-table`, `.juno-modal`, `.juno-menu`, `.juno-tabs`, `.juno-badge`,
  `.juno-avatar`, `.juno-dock`, `.juno-pillbar`, … — one class per component, BEM
  parts (`.juno-modal__title`), modifier suffixes (`.juno-btn--ghost`, `--sm`).
  Each component's `.prompt.md` shows its full anatomy — copy that markup.
- **Color = role, one mechanism everywhere**: add `.juno--nominal` / `.juno--active` /
  `.juno--target` / `.juno--caution` / `.juno--warning` / `.juno--muted` to any
  component to re-color it (it sets `--juno-role`). Never hardcode hex.
- **Text/surface utilities**: `.juno-heading`, `.juno-value`, `.juno-label`,
  `.juno-eyebrow`, `.juno-mono`, `.juno-text-<role|data|label|muted>`,
  `.juno-bg-s0…s3`, `.juno-sr-only`.
- **Layout primitives** (container-query driven, RTL-safe): `.juno-stack`,
  `.juno-cluster`, `.juno-center`, `.juno-sidebar`, `.juno-switcher`,
  `.juno-grid-auto` (`--tiles`), `.juno-reel`, `.juno-scroller` (`--x/--y/--bare`),
  `.juno-app-shell`. Prefer these over ad-hoc flex/grid CSS.
- **Tokens for custom glue**: `var(--juno-s0…s3)` surfaces, `var(--juno-data)` /
  `--juno-label` / `--juno-muted` text, `--juno-border`, `--juno-space-2…96`,
  `--juno-radius-2…8`, `--juno-shadow-1…3`, `--juno-font-family-sans` /
  `--juno-font-family-mono` (B612 — ships with the bundle),
  `--juno-motion-duration-*` / `--juno-motion-ease-*`.
- **Density**: `data-juno-density="compact"` (or `"auto"`) on a container tightens
  spacing. Logical properties throughout — RTL works automatically.

## Where the truth lives

Read `styles.css` (it `@import`s `_ds_bundle.css` — the complete compiled component
CSS) for any class you're unsure of; each component's `components/<Group>/<Name>/
<Name>.prompt.md` is its spec (anatomy table + usage rules); `guidelines/docs/`
holds accessibility, layout, and design guidelines.

## Idiomatic example

```jsx
function DeployPanel() {
  return (
    <section className="juno-card juno--active" style={{ maxInlineSize: 420 }}>
      <div className="juno-stack">
        <span className="juno-eyebrow">HYD SYS B</span>
        <h3 className="juno-heading">Pressure</h3>
        <p className="juno-value juno-text-nominal">89.3 <small>%</small></p>
        <div className="juno-cluster">
          <span className="juno-badge juno--nominal">NOMINAL</span>
          <span className="juno-badge juno--caution">CAUTION</span>
        </div>
        <button className="juno-btn juno--nominal">CONFIRM</button>
        <button className="juno-btn juno-btn--ghost">CANCEL</button>
      </div>
    </section>
  );
}
```

Native elements carry the semantics: real `<button>`, `<dialog>` for modal/drawer
(`open` + `showModal()`), native `popover` attribute for menu/popover, `<details>`
for accordion. junoui styles them; the app owns state and behavior.
