// ════════════════════════════════════════════════════════════════════════
//  junoui/tree — keyboard traversal for .juno-tree
// ════════════════════════════════════════════════════════════════════════
//  A tree without arrow-key traversal and a roving tabindex is a list of
//  buttons wearing tree roles. That part is behaviour, so no stylesheet can
//  ship it — and it is also the part apps get wrong, so junoui ships it
//  rather than only describing it.
//
//    import { enhanceTree } from 'junoui/tree';
//    const stop = enhanceTree(document.querySelector('.juno-tree'));
//
//  STATELESS, which is what keeps it inside junoui's "no stateful widgets"
//  line: it stores nothing. Expansion lives in `aria-expanded` and selection
//  in `aria-selected`, both on the DOM, both owned by your app — this reads
//  them, moves focus, and asks you to change them by dispatching events.
//  Unmount and remount the tree and nothing here needs to know.
//
//  WHAT IT DOES NOT DO: it does not expand, collapse, select or reorder. It
//  dispatches `juno-tree-toggle` and `juno-tree-select` (bubbling, cancelable,
//  `detail.item`) and leaves the decision to you, because in a real outliner
//  expanding a node may need to load it.
//
//  WAI-ARIA Authoring Practices, Tree View pattern. See
//  docs/components/tree.md for the full contract and the markup.
// ════════════════════════════════════════════════════════════════════════

const ITEM = '[role="treeitem"]';

/** Is this item's subtree currently shown? Absent aria-expanded = a leaf. */
const isExpanded = (el) => el.getAttribute('aria-expanded') === 'true';
const isBranch = (el) => el.hasAttribute('aria-expanded');

/** Every treeitem the user can currently reach, in visual order.
 *
 *  Derived from the DOM each time rather than cached: a tree's shape changes
 *  under it (lazy children, filtering, a reorder), and a cached list is a
 *  stale list the moment it does. Cheap — this only runs on a keypress. */
function visibleItems(root) {
  return [...root.querySelectorAll(ITEM)].filter((el) => {
    for (let p = el.parentElement?.closest(ITEM); p; p = p.parentElement?.closest(ITEM)) {
      if (!isExpanded(p)) return false;
    }
    return true;
  });
}

/** The row inside an item — the thing that actually takes focus. */
const rowOf = (item) => item.querySelector(':scope > .juno-tree__row') ?? item;

/** Move the roving tabindex, and focus. Exactly one row is tabbable at a
 *  time; that is the difference between one Tab stop and one per node. */
function focusItem(root, item) {
  for (const other of root.querySelectorAll(ITEM)) rowOf(other).tabIndex = -1;
  const row = rowOf(item);
  row.tabIndex = 0;
  row.focus();
}

const ask = (item, type) =>
  item.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail: { item } }));

/**
 * Wire keyboard traversal on a `.juno-tree`. Returns a teardown function.
 *
 * Idempotent: enhancing the same root twice replaces the first listener
 * rather than stacking two, so a framework that re-runs an effect does not
 * double-fire every keypress.
 */
export function enhanceTree(root) {
  if (!root) throw new Error('enhanceTree: no root element');
  root._junoTreeTeardown?.();

  // Seed the roving tabindex: the selected item if there is one, else the
  // first. Without this every row is tabbable (0) or none is (-1), and both
  // are wrong.
  const items = visibleItems(root);
  if (items.length) {
    for (const el of root.querySelectorAll(ITEM)) rowOf(el).tabIndex = -1;
    const seed = items.find((el) => el.getAttribute('aria-selected') === 'true') ?? items[0];
    rowOf(seed).tabIndex = 0;
  }

  const onKeyDown = (event) => {
    const item = event.target.closest(ITEM);
    if (!item || !root.contains(item)) return;

    const list = visibleItems(root);
    const at = list.indexOf(item);
    const go = (next) => {
      if (!next) return;
      event.preventDefault();
      focusItem(root, next);
    };

    switch (event.key) {
      case 'ArrowDown':
        return go(list[at + 1]);
      case 'ArrowUp':
        return go(list[at - 1]);

      case 'ArrowRight':
        // Closed branch → open it. Open branch → into its first child. Leaf →
        // nothing, which is the pattern's answer and not an oversight.
        if (isBranch(item) && !isExpanded(item)) {
          event.preventDefault();
          ask(item, 'juno-tree-toggle');
        } else if (isExpanded(item)) {
          go(list[at + 1]);
        }
        return;

      case 'ArrowLeft': {
        // Open branch → close it. Anything else → out to the parent. This is
        // what makes a deep tree navigable without a mouse.
        if (isBranch(item) && isExpanded(item)) {
          event.preventDefault();
          ask(item, 'juno-tree-toggle');
          return;
        }
        return go(item.parentElement?.closest(ITEM));
      }

      case 'Home':
        return go(list[0]);
      case 'End':
        return go(list[list.length - 1]);

      case 'Enter':
        event.preventDefault();
        return void ask(item, 'juno-tree-select');

      case ' ':
        // Space selects; it must not scroll the page out from under the tree.
        event.preventDefault();
        return void ask(item, 'juno-tree-select');

      case '*':
        // Expand every sibling at this level — the pattern's one bulk action.
        event.preventDefault();
        for (const sib of item.parentElement?.children ?? []) {
          if (sib.matches?.(ITEM) && isBranch(sib) && !isExpanded(sib)) {
            ask(sib, 'juno-tree-toggle');
          }
        }
        return;

      default:
        return;
    }
  };

  // Clicking a row moves the roving tabindex there too, or the next arrow key
  // jumps back to wherever focus notionally was.
  const onFocusIn = (event) => {
    const item = event.target.closest(ITEM);
    if (item && root.contains(item)) {
      for (const other of root.querySelectorAll(ITEM)) rowOf(other).tabIndex = -1;
      rowOf(item).tabIndex = 0;
    }
  };

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('focusin', onFocusIn);
  const teardown = () => {
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('focusin', onFocusIn);
    delete root._junoTreeTeardown;
  };
  root._junoTreeTeardown = teardown;
  return teardown;
}
