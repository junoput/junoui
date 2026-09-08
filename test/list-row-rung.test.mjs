// list/tree rows had exactly one width response — continuous ellipsis on
// __label/__support — and no discrete rung, so the label starved to
// nothing while __value/__count/__chevron kept their full width
// (20260908-034, deferred from the W6 sidebar audit 20260908-028).
//
// The drop order is principles-density.md §2 ("truncate the label before
// you ever consider truncating the value"), cited not re-argued: __value
// (list) and __trail (tree, may hold a live control) are never touched.
// __chevron (list) and __count (tree) are pure, non-interactive decoration
// and give their width back first.
//
// Both thresholds are DERIVED from tokens each row already reads (padding,
// gaps, icon size, and the chevron/caret's own fixed size) — never a
// typed-in pixel. Deliberately excludes __value's/__count's own width,
// which is arbitrary app content no CSS token can predict; that is a
// stated lower-bound limitation, not an oversight — see the comments in
// list.css/tree.css next to each @container rule.
//
// Plain text/regex parsing on the built bundle (test/README: "no deps"),
// matching test/rail-collapse-threshold.test.mjs and
// test/sidebar-wrap.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CORE } from '../dist/js/tokens.js';

const css = readFileSync('dist/css/juno.css', 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : undefined;
}

// Same brace-depth extractor as test/rail-collapse-threshold.test.mjs —
// needed because @container blocks hold a nested rule, so a simple
// "up to the next }" regex stops one brace too early, and the bundle has
// several unrelated @container blocks (card, table, rail) a naive "first
// match" would collide with.
function atRuleBlockContaining(atRulePattern, mustContain, searchFrom = 0) {
  const rest = css.slice(searchFrom);
  const startMatch = rest.match(atRulePattern);
  if (!startMatch) return undefined;
  const startIndex = searchFrom + startMatch.index;
  const openBrace = css.indexOf('{', startIndex);
  let depth = 0;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        const block = css.slice(startIndex, i + 1);
        if (block.includes(mustContain)) return block;
        return atRuleBlockContaining(atRulePattern, mustContain, i + 1);
      }
    }
  }
  return undefined;
}

function px(token) {
  assert.match(token, /^[\d.]+px$/, `expected a plain px token, got "${token}"`);
  return Number.parseFloat(token);
}

// ── derivations, from real built tokens, not typed-in numbers ─────────────
const LIST_ROW_PADDING_INLINE = 2 * px(CORE.space['16']);
const LIST_ICON_SIZE = 1.25 * px(CORE.font.size['13']);
const LIST_CHEVRON_SIZE = px(CORE.space['16']);
const LIST_ROW_GAPS = 2 * px(CORE.space['12']);
const LIST_DERIVED_FLOOR =
  LIST_ROW_PADDING_INLINE + LIST_ICON_SIZE + LIST_CHEVRON_SIZE + LIST_ROW_GAPS;

const TREE_ROW_PADDING_INLINE = 2 * px(CORE.space['8']);
const TREE_CARET_SIZE = px(CORE.space['16']);
const TREE_ICON_SIZE = 1.25 * px(CORE.font.size['13']);
const TREE_ROW_GAPS = 2 * px(CORE.space['8']);
const TREE_DERIVED_FLOOR =
  TREE_ROW_PADDING_INLINE + TREE_CARET_SIZE + TREE_ICON_SIZE + TREE_ROW_GAPS;

test('both derivations are real numbers, not NaN from a token that moved', () => {
  for (const n of [
    LIST_ROW_PADDING_INLINE,
    LIST_ICON_SIZE,
    LIST_CHEVRON_SIZE,
    LIST_ROW_GAPS,
    LIST_DERIVED_FLOOR,
    TREE_ROW_PADDING_INLINE,
    TREE_CARET_SIZE,
    TREE_ICON_SIZE,
    TREE_ROW_GAPS,
    TREE_DERIVED_FLOOR,
  ]) {
    assert.equal(Number.isFinite(n), true, `derivation produced a non-finite term: ${n}`);
  }
  assert.equal(LIST_DERIVED_FLOOR, 88.25);
  assert.equal(TREE_DERIVED_FLOOR, 64.25);
});

test('.juno-list__row opts into container queries on its own inline size', () => {
  const row = ruleBody('.juno-list__row');
  assert.ok(row, 'the base .juno-list__row rule is gone');
  assert.match(row, /container-type:\s*inline-size;/);
});

test('.juno-tree__row opts into container queries on its own inline size', () => {
  const row = ruleBody('.juno-tree__row');
  assert.ok(row, 'the base .juno-tree__row rule is gone');
  assert.match(row, /container-type:\s*inline-size;/);
});

test('the list chevron-drop rung fires at the derived floor, not a typed-in number', () => {
  const block = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-list__chevron',
  );
  assert.ok(block, 'no @container rule containing .juno-list__chevron found — the rung is gone');
  const thresholdText = block.match(/@container \(max-width:\s*([\d.]+)px\)/)[1];
  assert.equal(
    Number(thresholdText),
    LIST_DERIVED_FLOOR,
    `the @container threshold (${thresholdText}px) no longer matches the derivation (${LIST_DERIVED_FLOOR}px) — a token moved without the threshold moving, or it was hand-edited`,
  );
  assert.match(
    block,
    /\.juno-list__chevron\s*\{\s*display:\s*none;/,
    'the rung must hide the chevron',
  );
});

test('the tree count-drop rung fires at the derived floor, not a typed-in number', () => {
  const block = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-tree__count',
  );
  assert.ok(block, 'no @container rule containing .juno-tree__count found — the rung is gone');
  const thresholdText = block.match(/@container \(max-width:\s*([\d.]+)px\)/)[1];
  assert.equal(
    Number(thresholdText),
    TREE_DERIVED_FLOOR,
    `the @container threshold (${thresholdText}px) no longer matches the derivation (${TREE_DERIVED_FLOOR}px) — a token moved without the threshold moving, or it was hand-edited`,
  );
  assert.match(
    block,
    /\.juno-tree__count\s*\{\s*display:\s*none;/,
    'the rung must hide the count badge',
  );
});

test("the list rung never touches __value — the density principle's protected element", () => {
  const block = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-list__chevron',
  );
  assert.ok(block);
  assert.doesNotMatch(
    block,
    /\.juno-list__value/,
    '__value must never be touched by a resize rung — principles-density.md §2 forbids truncating or hiding it',
  );
});

test('the tree rung never touches __trail — it may hold a live control', () => {
  const block = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-tree__count',
  );
  assert.ok(block);
  assert.doesNotMatch(
    block,
    /\.juno-tree__trail/,
    '__trail must never be auto-hidden — it can carry a switch or menu trigger, a functionality loss junoui cannot see coming',
  );
});
