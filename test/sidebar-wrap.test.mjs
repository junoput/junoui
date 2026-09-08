// The sidebar resize ladder's "whole composition stops fitting side by
// side" rung (docs/sidebar-behaviour.md §2, rung 4) — landed long before
// 20260908-028 but never named in that table. This is the audit's evidence
// for "exists, undocumented": the mechanism is checked here structurally,
// and the doc is what closes the gap between spec and CSS.
//
// The rung has no breakpoint number at all — pure flex arithmetic (the
// aside's flex-basis vs. main's percentage min-inline-size) rather than a
// typed-in threshold, so there is nothing to derive-and-assert the way
// rail.css's 57px collapse floor needed. What IS assertable, and what a
// future edit could silently break, is the RELATIONSHIP: the sidebar wraps
// (flex-wrap), the aside's width and main's floor are both real values (not
// bare var() fallbacks nobody set), and main can shrink to a genuine
// percentage of the row rather than to a fixed pixel that would defeat the
// "container width, not viewport width" framing this whole document uses.
//
// Plain text/regex parsing on the built bundle (test/README: "no deps"),
// matching test/sidebar-rail-width.test.mjs and
// test/rail-collapse-threshold.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

test('.juno-sidebar wraps instead of forcing its children to fit on one line', () => {
  const sidebar = ruleBody('.juno-sidebar');
  assert.ok(sidebar, 'the base .juno-sidebar rule is gone');
  assert.match(
    sidebar,
    /flex-wrap:\s*wrap;/,
    'without flex-wrap: wrap, the aside/main pair can never move to a stacked layout — the whole rung depends on this one declaration',
  );
});

test('the aside reserves a real width the row can measure against, not just a fallback', () => {
  const aside = ruleBody('.juno-sidebar > .juno-sidebar__aside');
  assert.ok(aside, 'the .juno-sidebar > .juno-sidebar__aside rule is gone');
  const width = declValue(aside, '--juno-sidebar-width');
  assert.ok(width, '--juno-sidebar-width is not declared as a real value on the aside');
  assert.doesNotMatch(
    width,
    /var\(/,
    '--juno-sidebar-width should be a plain value, not another var() reference',
  );
  assert.match(
    declValue(aside, 'flex-basis'),
    /var\(--juno-sidebar-width\)/,
    "the aside's flex-basis must read --juno-sidebar-width for the wrap threshold to move when that variable does",
  );
});

test("main's floor is a real percentage of the row, not a fixed pixel that would defeat container-width framing", () => {
  const main = ruleBody('.juno-sidebar > .juno-sidebar__main');
  assert.ok(main, 'the .juno-sidebar > .juno-sidebar__main rule is gone');
  const minInlineSize = declValue(main, 'min-inline-size');
  assert.ok(
    minInlineSize,
    '.juno-sidebar__main declares no min-inline-size — the wrap threshold has nothing to react to',
  );
  assert.match(
    minInlineSize,
    /var\(--juno-sidebar-content-min,\s*60%\)/,
    "main's floor must stay a var()-with-percentage-fallback pair — a literal pixel value here would make the wrap threshold a viewport-width rule in disguise, exactly what this document argues against",
  );
  // flex-grow: 999 is what makes main absorb all extra space rather than
  // growing 1:1 with the aside — asserted because a future edit that drops
  // it back to 1 would still "work" in the sense of not erroring, while
  // silently changing which pane gets the room first.
  assert.match(
    declValue(main, 'flex-grow'),
    /^999$/,
    "main's flex-grow must dominate the aside's, or extra width splits between them instead of going to content",
  );
});
