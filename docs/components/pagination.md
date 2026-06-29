# Pagination

A row of page controls — prev / next plus numbered pages, with the current page marked
`aria-current="page"`. Built on a real `<nav>`; the app owns which page is active and
renders the list. Zero JS.

## Web

```html
<nav class="juno-pagination" aria-label="Pagination">
  <button class="juno-pagination__item" aria-label="Previous page" disabled>
    <svg class="juno-icon juno-icon--sm" aria-hidden="true"><use href="…#juno-i-caret-left" /></svg>
  </button>
  <button class="juno-pagination__item" aria-current="page">1</button>
  <button class="juno-pagination__item">2</button>
  <button class="juno-pagination__item">3</button>
  <span class="juno-pagination__gap">…</span>
  <button class="juno-pagination__item">9</button>
  <button class="juno-pagination__item" aria-label="Next page">
    <svg class="juno-icon juno-icon--sm" aria-hidden="true">
      <use href="…#juno-i-caret-right" />
    </svg>
  </button>
</nav>
```

| Part / attr              | Effect                                                 |
| ------------------------ | ------------------------------------------------------ |
| `.juno-pagination`       | `<nav>` flex row; wraps on narrow widths.              |
| `.juno-pagination__item` | Page / prev / next button (44px tap target, mono).     |
| `[aria-current="page"]`  | Current page — filled `active` accent, non-actionable. |
| `:disabled`              | Dim prev / next at the ends.                           |
| `.juno-pagination__gap`  | The `…` between page ranges (not a button).            |

## Usage

- `aria-label="Pagination"` on the `<nav>`; `aria-current="page"` on the active page;
  `aria-label` on the icon-only prev / next ("Previous page").
- The app computes the window of page numbers + where `…` falls, and disables prev / next
  at the ends.
- For a simple "‹ Prev / Next ›" pair (as in the [table](./table.md) footer), use two
  `__item` buttons without the numbered list.
