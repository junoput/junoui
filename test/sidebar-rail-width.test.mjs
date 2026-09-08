// A .juno-rail composed as a .juno-sidebar's aside used to have two
// independently defaulted widths active at once: the aside reserved
// `flex-basis: var(--juno-sidebar-width, 280px)` while the rail painted
// itself at `--juno-rail-width: 180px` — two numbers agreeing by coincidence,
// never by construction (20260908-001, W3 gap 2). The fix makes
// --juno-sidebar-width a real declaration the aside sets, and the rail read
// THAT variable when composed inside it, so there is one number, not two.
//
// These assert the RELATIONSHIP survives a retune, not a specific pixel
// value: "assert rail width === 280" would pass for the wrong reason and rot
// the day the sidebar's default changes. Mutation-tested: see the ticket's
// PR description for the red/green proof.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const css = readFileSync('dist/css/juno.css', 'utf8');
const root = postcss.parse(css);

function findRule(selector) {
  let found;
  root.walkRules(selector, (rule) => {
    found = rule;
  });
  return found;
}

function declValue(rule, prop) {
  let value;
  rule.walkDecls(prop, (decl) => {
    value = decl.value;
  });
  return value;
}

test('the sidebar aside declares --juno-sidebar-width as a real value, not only a var() fallback', () => {
  const aside = findRule('.juno-sidebar > .juno-sidebar__aside');
  assert.ok(aside, 'the .juno-sidebar > .juno-sidebar__aside rule is gone');
  const declared = declValue(aside, '--juno-sidebar-width');
  assert.ok(
    declared,
    'the aside no longer declares --juno-sidebar-width directly — without a real declaration the rail composition rule below has nothing to inherit',
  );
  assert.doesNotMatch(
    declared,
    /var\(/,
    '--juno-sidebar-width should be a plain value here, not itself another var() reference',
  );
});

test("a rail composed inside a sidebar aside reads the aside's own width variable, not its own literal default", () => {
  const composed = findRule('.juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed)');
  assert.ok(
    composed,
    'the .juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed) composition rule is gone',
  );
  const value = declValue(composed, '--juno-rail-width');
  assert.match(
    value,
    /var\(--juno-sidebar-width/,
    `the composed rail's --juno-rail-width must reference --juno-sidebar-width (a relationship), not restate a literal width (a coincidence) — got "${value}"`,
  );
});

test('the composition rule excludes a collapsed rail, so collapse keeps winning', () => {
  // Collapse is a deeper, deliberate override (icon-only) and must not be
  // reopened by the sidebar composition rule reserving the aside's full
  // width for it. If this selector ever drops the :not(), a collapsed rail
  // nested in a sidebar aside would silently re-expand to the aside's width.
  const composed = findRule('.juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed)');
  assert.ok(composed);
  assert.equal(composed.selector, '.juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed)');
});

test("the composition rule's defensive fallback cannot silently diverge from the aside's real default", () => {
  // In the documented composition (.juno-sidebar > .juno-sidebar__aside >
  // .juno-rail) the rail always inherits the aside's REAL declared value, so
  // this fallback only matters for a .juno-sidebar__aside used without its
  // .juno-sidebar parent (malformed markup). Asserted anyway: even that edge
  // case should not silently reintroduce two different numbers.
  const aside = findRule('.juno-sidebar > .juno-sidebar__aside');
  const asideDefault = Number(declValue(aside, '--juno-sidebar-width').match(/[\d.]+/)[0]);

  const composed = findRule('.juno-sidebar__aside > .juno-rail:not(.juno-rail--collapsed)');
  const composedValue = declValue(composed, '--juno-rail-width');
  const fallbackMatch = composedValue.match(/var\(--juno-sidebar-width,\s*([\d.]+)px\)/);
  assert.ok(
    fallbackMatch,
    `composed rail's --juno-rail-width has no numeric var() fallback to check — got "${composedValue}"`,
  );
  assert.equal(
    Number(fallbackMatch[1]),
    asideDefault,
    "the composition rule's defensive fallback no longer matches the aside's real default — they must agree even in the malformed-markup edge case",
  );
});

test('a bare rail outside .juno-sidebar keeps its own 180px default, unaffected', () => {
  const bare = findRule(/^\.juno-rail$/);
  assert.ok(bare, 'the base .juno-rail rule is gone');
  const value = declValue(bare, '--juno-rail-width');
  assert.equal(
    value,
    '180px',
    'the base rail default moved — this test pins it so the composition rule above stays a distinct, additive case, not a replacement for it',
  );
});
