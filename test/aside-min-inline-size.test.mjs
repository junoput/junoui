// A .juno-sidebar__aside had no floor: with flex-grow: 1 and no
// min-inline-size, ordinary flex-shrink could render it narrower than the
// rail composed inside it wants to be — the rail's own clamp
// (max(var(--juno-rail-width), 57px), rail.css, 20260908-036) only
// guarantees what the RAIL's box wants, never that the ANCESTOR honours it
// (20260908-040, found while closing 20260908-036).
//
// The fix reuses rail.css's own expression and variable rather than
// re-deriving: max(var(--juno-sidebar-width), 57px) as this aside's
// min-inline-size, so it can never be narrower than what the rail inside
// it will actually try to render at. 57px is imported from
// scripts/rail-collapse-derivation.mjs — NOT recomputed a third time; that
// module already serves rail.css's clamp and its auto-collapse threshold.
//
// Plain text/regex parsing on the built bundle (test/README: "no deps"),
// matching test/sidebar-rail-width.test.mjs and
// test/rail-collapse-threshold.test.mjs. The one non-"no deps" import here
// is the shared derivation module itself, a local file, same as importing
// dist/js/tokens.js elsewhere in this suite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DERIVED_FLOOR_COMFORTABLE } from '../scripts/rail-collapse-derivation.mjs';

const css = readFileSync('dist/css/juno.css', 'utf8');

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : undefined;
}

function declValue(body, prop) {
  if (!body) return undefined;
  const match = body.match(new RegExp(`${prop.replace(/-/g, '\\-')}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
}

test('the derivation is a real number, not NaN from a token that moved', () => {
  assert.equal(Number.isFinite(DERIVED_FLOOR_COMFORTABLE), true);
  assert.equal(DERIVED_FLOOR_COMFORTABLE, 57);
});

test('an aside holding an uncollapsed rail floors at max(--juno-sidebar-width, 57px) — the SAME expression the rail itself uses', () => {
  const rule = ruleBody(
    '.juno-sidebar > .juno-sidebar__aside:has(> .juno-rail:not(.juno-rail--collapsed))',
  );
  assert.ok(rule, 'the aside floor rule for an uncollapsed rail is gone');
  const minInlineSize = declValue(rule, 'min-inline-size');
  assert.ok(minInlineSize, 'no min-inline-size declared');
  assert.match(
    minInlineSize,
    /var\(--juno-sidebar-width\)/,
    'must reference --juno-sidebar-width — the same variable the rail composition rule ties the rail to, or the aside and the rail can disagree about what "enough room" means again',
  );
  const floorMatch = minInlineSize.match(/max\(var\(--juno-sidebar-width\),\s*([\d.]+)px\)/);
  assert.ok(
    floorMatch,
    `min-inline-size is not a max(var(--juno-sidebar-width), Npx) expression — got "${minInlineSize}"`,
  );
  assert.equal(
    Number(floorMatch[1]),
    DERIVED_FLOOR_COMFORTABLE,
    `the aside's floor (${floorMatch[1]}px) no longer matches rail.css's own clamp (${DERIVED_FLOOR_COMFORTABLE}px) — the two must share one number, not two typed-in copies`,
  );
});

test("the uncollapsed-rail floor matches rail.css's own clamp literally, not just numerically", () => {
  // Belt and suspenders on top of the previous test: assert the two CSS
  // rules use the identical max() expression string, so a future edit
  // that changes one side's argument order/spacing without the other
  // still gets caught even if the derived number happens to still match.
  const railClamp = declValue(ruleBody('.juno-rail:not(.juno-rail--collapsed)'), 'inline-size');
  const asideFloor = declValue(
    ruleBody('.juno-sidebar > .juno-sidebar__aside:has(> .juno-rail:not(.juno-rail--collapsed))'),
    'min-inline-size',
  );
  assert.ok(railClamp && asideFloor);
  const railNum = railClamp.match(/max\(var\(--juno-rail-width\),\s*([\d.]+)px\)/)?.[1];
  const asideNum = asideFloor.match(/max\(var\(--juno-sidebar-width\),\s*([\d.]+)px\)/)?.[1];
  assert.ok(
    railNum && asideNum,
    `could not extract both floors — rail: "${railClamp}", aside: "${asideFloor}"`,
  );
  assert.equal(
    railNum,
    asideNum,
    'the rail clamp and the aside floor use different literal numbers',
  );
});

test('an aside holding a collapsed rail floors at the collapsed width, not the uncollapsed one', () => {
  const rule = ruleBody('.juno-sidebar > .juno-sidebar__aside:has(> .juno-rail--collapsed)');
  assert.ok(rule, 'the aside floor rule for a collapsed rail is gone');
  assert.match(
    declValue(rule, 'min-inline-size'),
    /var\(--juno-space-56\)/,
    'a collapsed rail wants --juno-space-56, not the uncollapsed 57px floor — forcing the aside open past what a collapsed rail needs would defeat collapsing',
  );
});

test('the collapsed-rail floor never forces the aside back up to --juno-sidebar-width', () => {
  const rule = ruleBody('.juno-sidebar > .juno-sidebar__aside:has(> .juno-rail--collapsed)');
  assert.ok(rule);
  assert.doesNotMatch(
    declValue(rule, 'min-inline-size'),
    /--juno-sidebar-width/,
    'the collapsed-rail floor must not reference --juno-sidebar-width — a collapsed rail does not read it either (the composition rule excludes it), so holding the aside open at the pre-collapse width would be a regression this rule exists to prevent',
  );
});
