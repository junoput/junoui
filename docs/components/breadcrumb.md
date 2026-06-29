# Breadcrumb

A horizontal trail of links to ancestor pages, ending at the current page. Built on a
real `<nav><ol>`; the separator is a CSS chevron (no glyph font). Zero JS.

## Web

```html
<nav class="juno-breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/fleet">Fleet</a></li>
    <li><a aria-current="page">api-gateway</a></li>
  </ol>
</nav>
```

| Part / attr             | Effect                                               |
| ----------------------- | ---------------------------------------------------- |
| `.juno-breadcrumb`      | `<nav>` wrapper; lay out an `<ol>` of `<li>` inside. |
| `li + li::before`       | CSS chevron separator (rotates under RTL).           |
| `a[href]`               | `label` link → `data` + underline on hover.          |
| `[aria-current="page"]` | The current crumb — brightest, semibold, not a link. |

## Usage

- Always `aria-label="Breadcrumb"` on the `<nav>`, and `aria-current="page"` on the last
  crumb (drop its `href` so it isn't a link).
- Order matters: root → … → current, left to right (mirrors under `dir="rtl"`).
- For very deep trails, collapse the middle to an ellipsis crumb the app expands — junoui
  ships the look, the app owns the collapse.
