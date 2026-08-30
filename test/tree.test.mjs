// Tree / outliner (X2 / 20260829-022) — the structural half.
//
// Keyboard traversal and the touch hit areas need a layout engine and are in
// test/visual/tree-keyboard.spec.mjs. What is checkable here is the contract
// the markup has to satisfy and the shape of the CSS that carries it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Comments stripped once, here. Every regex in this file scans for rules, and
// a doc block sitting between `}` and the next selector defeats a boundary
// match — the third time in this repo that prose has been read as code, so it
// is handled at the source rather than per-assertion.
const css = readFileSync('dist/css/juno.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '\n');
const manifest = JSON.parse(readFileSync('dist/classes.json', 'utf8'));
const showcase = readFileSync('showcase/data-display.html', 'utf8');

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(m, `no \`${selector}\` rule in the bundle`);
  return m[1];
};

test('the bundle and the showcase are actually read', () => {
  assert.ok(css.length > 1000);
  assert.ok(showcase.includes('juno-tree'), 'the showcase has no tree to check');
});

test('every tree class is in the manifest and documented', () => {
  // Conformance kit slice 1: a class a consumer can name has to exist, and
  // `public` is derived from the docs, so this also fails if the component
  // ships undocumented.
  const tree = manifest.all.filter((c) => c.startsWith('juno-tree'));
  assert.ok(tree.length >= 8, `only ${tree.length} tree classes`);
  assert.deepEqual(
    tree.filter((c) => !manifest.public.includes(c)),
    [],
    'tree classes with rules but no documentation',
  );
});

test('the row holds the tap floor rather than each control', () => {
  // The row is the target; the caret and the handle grow their HIT AREA only
  // (see the coarse block), because a 44px painted caret swallows the row.
  assert.match(rule('.juno-tree__row'), /min-block-size:\s*var\(--juno-size-tap-min\)/);
  assert.ok(
    !/min-block-size|min-inline-size/.test(rule('.juno-tree__caret')),
    'the caret sizes itself instead of growing its hit area',
  );
});

test('depth is structural, not a level number someone keeps in sync', () => {
  // One indent step on the nested group. If this ever becomes a per-row custom
  // property or an inline style, arbitrary depth stops being free and a
  // mislabelled aria-level starts changing the layout.
  assert.match(rule('.juno-tree__group'), /padding-inline-start:\s*var\(--juno-tree-indent\)/);
  assert.match(rule('.juno-tree'), /--juno-tree-indent:/);
  assert.ok(!/juno-tree-level/.test(css), 'depth is being carried by a level variable');
});

test('collapse is driven by aria-expanded, not by a class', () => {
  // The attribute IS the state — a parallel `--collapsed` class is a second
  // source of truth that a screen reader cannot see.
  assert.match(css, /\.juno-tree__item\[aria-expanded=['"]false['"]\]\s*>\s*\.juno-tree__group/);
  assert.ok(!/juno-tree--collapsed|juno-tree__item--open/.test(css));
});

test('selection, current and hover are three different paints', () => {
  // The ticket's explicit ask, and the common bug. Conflating them means "what
  // the next action applies to" and "which node you are on" cannot both show.
  assert.match(css, /\.juno-tree__item\[aria-selected=['"]true['"]\]\s*>\s*\.juno-tree__row/);
  assert.match(css, /\.juno-tree__item\[aria-current\]\s*>\s*\.juno-tree__row/);
  assert.match(css, /\.juno-tree__row:hover/);
});

test('the reorder handle opts out of touch scrolling by itself', () => {
  // touch-action: none on the HANDLE, not the row: dragging the handle must
  // not scroll, while the rest of the row still pans. A tree beside a pan
  // surface cannot claim the whole row for a drag.
  assert.match(rule('.juno-tree__handle'), /touch-action:\s*none/);
  assert.ok(
    !/touch-action:\s*none/.test(rule('.juno-tree__row')),
    'the whole row opts out of panning',
  );
});

test('a drop between rows looks different from a drop into one', () => {
  // Different operations in a tree, and the one users complain about.
  for (const where of ['before', 'after', 'into']) {
    assert.match(
      css,
      new RegExp(`\\[data-juno-drop=['"]${where}['"]\\]`),
      `no ${where} drop style`,
    );
  }
});

// ── the ARIA contract, checked against the showcase markup ───────────────
// The showcase is the only markup junoui controls, so it is where the contract
// is demonstrable. A consumer copying it gets a conformant tree; if the
// example rots, this fails.
const items = [...showcase.matchAll(/<li class="juno-tree__item"([^>]*)>/g)].map((m) => m[1]);

test('the showcase tree satisfies the contract it documents', () => {
  assert.ok(items.length >= 5, `only ${items.length} treeitems in the showcase`);

  const root = /<ul class="juno-tree"([^>]*)>/.exec(showcase)?.[1] ?? '';
  assert.match(root, /role="tree"/);
  assert.match(root, /aria-label="[^"]+"/, 'the tree root has no accessible name');

  for (const attrs of items) {
    assert.match(attrs, /role="treeitem"/);
    // aria-level on EVERY item: nesting is visual, and a screen reader does
    // not infer depth from indentation.
    assert.match(attrs, /aria-level="\d+"/, `treeitem without aria-level: ${attrs.trim()}`);
    assert.match(attrs, /aria-selected="(true|false)"/, `treeitem without aria-selected`);
  }

  // Nested lists carry role=group, or the levels are not related.
  const groups = [...showcase.matchAll(/<ul class="juno-tree__group"([^>]*)>/g)];
  assert.ok(groups.length >= 2, 'the showcase tree does not nest');
  for (const [, attrs] of groups) assert.match(attrs, /role="group"/);
});

test('a leaf has no aria-expanded, and a branch has one', () => {
  // The distinction the pattern rests on: absence of aria-expanded is what
  // makes an item a leaf. `aria-expanded="false"` on a childless row is
  // announced as a collapsed branch that never opens — a real defect, and an
  // easy one to introduce by templating the attribute unconditionally.
  const blocks = showcase.split('<li class="juno-tree__item"').slice(1);
  let branches = 0;
  let leaves = 0;
  for (const block of blocks) {
    const attrs = block.slice(0, block.indexOf('>'));
    // does this item open its own nested group before the next item starts?
    const hasGroup = /<ul class="juno-tree__group"/.test(
      block.split('<li class="juno-tree__item"')[0],
    );
    const declares = /aria-expanded=/.test(attrs);
    if (hasGroup) {
      branches++;
      assert.ok(declares, `a branch without aria-expanded: ${attrs.trim()}`);
    } else {
      leaves++;
      assert.ok(!declares, `a leaf declaring aria-expanded: ${attrs.trim()}`);
    }
  }
  assert.ok(branches >= 2, `only ${branches} branches`);
  assert.ok(leaves >= 3, `only ${leaves} leaves`);
});

test('the caret is not a second tab stop', () => {
  // Left and Right already collapse and expand from the row, so a focusable
  // caret adds a stop in the tab order for an action the row has. It stays a
  // real button for the pointer, hence tabindex=-1 + aria-hidden rather than
  // a span.
  for (const [, attrs] of showcase.matchAll(/<button class="juno-tree__caret"([^>]*)>/g)) {
    assert.match(attrs, /tabindex="-1"/);
    assert.match(attrs, /aria-hidden="true"/);
  }
});

test('every reorder handle has an accessible name', () => {
  // An icon-only button with no name is a button announced as "button".
  const handles = [...showcase.matchAll(/<button class="juno-tree__handle"([^>]*)>/g)];
  assert.ok(handles.length >= 4, `only ${handles.length} handles`);
  for (const [, attrs] of handles) {
    assert.match(attrs, /aria-label="[^"]+"/, `handle without an accessible name: ${attrs.trim()}`);
  }
});
