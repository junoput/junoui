// Gap 1 from docs/sidebar-behaviour.md (W3): .juno-rail--collapsed shipped
// the icon-only VISUAL result but nothing decided WHEN to apply it — no
// @container anywhere in rail.css, so collapse was purely app-toggled and
// two consumers of the same composition could pick two different
// thresholds (20260908-005).
//
// The fix keys collapse off the rail's own measured width via @container,
// at a threshold DERIVED from tokens junoui already owns (item padding,
// item border, icon size, control gap) rather than a chosen number. These
// tests recompute that derivation from the built token values and assert
// the CSS literal matches it — "assert the relationship, not the value":
// a retuned space/font-size token must move this threshold too, or the
// test fails.
//
// Plain text/regex parsing on the built bundle (test/README: "no deps"),
// same approach as test/sidebar-rail-width.test.mjs — no postcss.
//
// The derivation itself lives in scripts/rail-collapse-derivation.mjs, not
// here — 20260908-036 reuses the SAME computation for the width-clamp
// floor, and importing one shared module is what makes "reuse" true rather
// than asserted; a second copy in each test file would be exactly the
// coincidental-agreement defect this programme keeps removing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TERMS,
  DERIVED_FLOOR_COMFORTABLE,
  DERIVED_FLOOR_COMPACT,
} from '../scripts/rail-collapse-derivation.mjs';

const { ITEM_PADDING_INLINE, ITEM_BORDER_INLINE_START, ICON_SIZE, GAP_COMFORTABLE, GAP_COMPACT } =
  TERMS;

const css = readFileSync('dist/css/juno.css', 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : undefined;
}

// Extracts a full @container/@media block (which can hold several nested
// rules, so a simple "up to the next }" regex would stop too early) by
// brace-depth counting from a marker that identifies which block, rather
// than trusting position-in-file — the bundle concatenates every
// component's CSS, so "the first @container" is card.css's, not rail's.
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
        // Same at-rule shape reused elsewhere (e.g. card's @container) —
        // keep looking past this block.
        return atRuleBlockContaining(atRulePattern, mustContain, i + 1);
      }
    }
  }
  return undefined;
}

test('the derivation floor is a real number, not NaN from a token that moved', () => {
  // A vacuity floor for the derivation itself: if any CORE lookup above
  // silently resolved to undefined, every arithmetic result becomes NaN,
  // and NaN !== NaN would make every equality assertion below trivially
  // pass or fail for the wrong reason.
  for (const n of [
    ITEM_PADDING_INLINE,
    ITEM_BORDER_INLINE_START,
    ICON_SIZE,
    GAP_COMFORTABLE,
    GAP_COMPACT,
    DERIVED_FLOOR_COMFORTABLE,
    DERIVED_FLOOR_COMPACT,
  ]) {
    assert.equal(Number.isFinite(n), true, `derivation produced a non-finite term: ${n}`);
  }
  assert.equal(DERIVED_FLOOR_COMFORTABLE, 57);
  assert.equal(DERIVED_FLOOR_COMPACT, 53);
});

test('.juno-rail opts into container queries on its own inline size', () => {
  const rail = ruleBody('.juno-rail');
  assert.ok(rail, 'the base .juno-rail rule is gone');
  assert.match(
    rail,
    /container-type:\s*inline-size;/,
    'a container query on .juno-rail needs container-type: inline-size — without it the @container rule below can never match',
  );
});

test('.juno-rail__label truncates instead of overflowing', () => {
  // Prerequisite for the whole derivation: the floor below assumes the
  // label can shrink to zero width via ellipsis rather than needing its
  // own minimum-width allowance. Before this fix .juno-rail__label had no
  // text-overflow at all, unlike every other icon+label row in junoui.
  const label = ruleBody('.juno-rail__label');
  assert.ok(label, 'the .juno-rail__label rule is gone');
  assert.match(label, /overflow:\s*hidden;/);
  assert.match(label, /text-overflow:\s*ellipsis;/);
});

test('the auto-collapse container query fires at the derived floor, not a typed-in number', () => {
  const block = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-rail__label',
  );
  assert.ok(
    block,
    'no @container (max-width: ...) rule containing .juno-rail__label found — the auto-collapse rule is gone',
  );
  const thresholdText = block.match(/@container \(max-width:\s*([\d.]+)px\)/)[1];
  assert.equal(
    Number(thresholdText),
    DERIVED_FLOOR_COMFORTABLE,
    `the @container threshold (${thresholdText}px) no longer matches the derivation (${DERIVED_FLOOR_COMFORTABLE}px = ` +
      `${ITEM_PADDING_INLINE} padding + ${ITEM_BORDER_INLINE_START} border + ${ICON_SIZE} icon + ${GAP_COMFORTABLE} gap) — ` +
      'a token moved without the threshold moving, or the threshold was hand-edited',
  );
  assert.match(
    block,
    /\.juno-rail__label\s*\{\s*display:\s*none;/,
    'the auto-collapse rule must hide the label',
  );
  assert.match(
    block,
    /justify-content:\s*center;/,
    'the auto-collapse rule must center the item/brand, matching .juno-rail--collapsed',
  );
});

test('the auto-collapse rule applies the identical treatment .juno-rail--collapsed applies by hand', () => {
  // Two mechanisms (an app-toggled class, and a container query) reaching
  // the same visual state is fine; two DIFFERENT visual states for
  // "collapsed" would be the coincidental-agreement failure this whole
  // programme exists to avoid. Compare the declaration bodies structurally
  // rather than by string-equality (the two blocks list their selectors in
  // a different order), so a genuine future divergence in one direction
  // fails and reordering the rules does not.
  const manual = css.match(
    /\.juno-rail--collapsed \.juno-rail__item,\n\.juno-rail--collapsed \.juno-rail__brand \{([^}]*)\}/,
  );
  const autoBlock = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-rail__label',
  );
  const auto = autoBlock && autoBlock.match(/\.juno-rail__item,\s*\.juno-rail__brand \{([^}]*)\}/);
  assert.ok(manual, 'the .juno-rail--collapsed item/brand rule is gone');
  assert.ok(auto, 'the auto-collapse item/brand rule is gone');
  const norm = (s) =>
    s
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .sort();
  assert.deepEqual(norm(auto[1]), norm(manual[1]));
});

test('the auto-collapse rule is unrelated to the pointer-first responsive @media', () => {
  // The two must not be merged — see the comment in rail.css. Assert they
  // remain textually distinct rules (different at-rule, different
  // condition) rather than one being folded into the other.
  const container = atRuleBlockContaining(
    /@container \(max-width:\s*([\d.]+)px\)/,
    '.juno-rail__label',
  );
  const media = css.match(
    /@media \(pointer: coarse\) and \(\(width <= 767\.98px\) or \(height <= 500px\)\)/,
  );
  assert.ok(container, 'the auto-collapse @container rule is gone');
  assert.ok(
    media,
    'the pointer-first @media rule is gone — this test also guards that it stayed put',
  );
});

// ── 20260908-036: the width clamp reuses the SAME derivation, not a second
//    one — every assertion below is against DERIVED_FLOOR_COMFORTABLE,
//    the identical constant the auto-collapse tests above check.

test('the width clamp is a real rule, floors at the derived value, and bounds one direction only', () => {
  const clamp = ruleBody('.juno-rail:not(.juno-rail--collapsed)');
  assert.ok(clamp, 'the .juno-rail:not(.juno-rail--collapsed) rule is gone');
  const inlineSize = clamp.match(/inline-size:\s*([^;]+);/)?.[1]?.trim();
  assert.ok(inlineSize, 'the clamp rule sets no inline-size at all');
  assert.match(
    inlineSize,
    /^max\(/,
    `expected a one-sided floor via max(), got "${inlineSize}" — clamp() or min() would also bound the CONSUMER'S larger requests, which the ticket says must still resolve unchanged`,
  );
  assert.doesNotMatch(
    inlineSize,
    /\bclamp\(|\bmin\(/,
    'the clamp expression also uses clamp()/min() — that would impose a ceiling this rule must not have',
  );
  assert.match(
    inlineSize,
    /var\(--juno-rail-width\)/,
    'the clamp lost the consumer override entirely',
  );

  const floorText = inlineSize.match(/,\s*([\d.]+)px\)/)?.[1];
  assert.ok(floorText, `could not find a "..., Npx)" floor in "${inlineSize}"`);
  assert.equal(
    Number(floorText),
    DERIVED_FLOOR_COMFORTABLE,
    `the clamp floor (${floorText}px) no longer matches the SAME derivation the auto-collapse threshold uses ` +
      `(${DERIVED_FLOOR_COMFORTABLE}px) — reusing one derivation for both is the whole point; if they are meant ` +
      'to differ now, say so in rail.css and update this test deliberately, not by drift',
  );
});

test('a larger consumer request still resolves unchanged — the floor is one-sided', () => {
  // CSS max() is a pure function of its arguments — max(240px, 57px) = 240px
  // regardless of runtime layout — so this is checkable without a browser:
  // assert the STRUCTURE (max, not clamp/min) rather than a rendered pixel.
  // The real geometric claim (a consumer requesting 240px really measures
  // 240px in a live layout) is exactly what test/visual/*.spec.mjs is for;
  // this test only guards that the CSS keeps the right shape to make that
  // true, which is what a source-level suite can actually check.
  const clamp = ruleBody('.juno-rail:not(.juno-rail--collapsed)');
  assert.ok(clamp);
  assert.match(clamp, /max\(var\(--juno-rail-width\),\s*57px\)/);
});

test('the collapsed rail is NOT clamped — its own 56px stays 56px, not floored to 57px', () => {
  // The floor rule is scoped to :not(.juno-rail--collapsed) specifically so
  // it does not apply here. Assert the NEGATIVE directly: no rule matching
  // ".juno-rail--collapsed" (in either selector position) sets inline-size
  // at all — collapsed must fall through to the base .juno-rail rule's
  // plain, unclamped `inline-size: var(--juno-rail-width)`.
  const collapsedWidth = ruleBody('.juno-rail--collapsed');
  assert.ok(collapsedWidth, 'the .juno-rail--collapsed rule is gone');
  assert.match(
    collapsedWidth,
    /--juno-rail-width:\s*var\(--juno-space-56\)/,
    'collapsed no longer sets its own 56px width — has the token changed on purpose?',
  );
  assert.doesNotMatch(
    collapsedWidth,
    /inline-size/,
    'the .juno-rail--collapsed rule now sets inline-size directly — check it is not silently re-introducing the 57px floor for the collapsed state',
  );
});

test('the base .juno-rail rule still has an unclamped fallback for the collapsed case', () => {
  const base = ruleBody('.juno-rail');
  assert.ok(base, 'the base .juno-rail rule is gone');
  assert.match(
    base,
    /inline-size:\s*var\(--juno-rail-width\);/,
    'the base rule no longer has a plain inline-size — the collapsed rail would have nothing to fall back to',
  );
});
