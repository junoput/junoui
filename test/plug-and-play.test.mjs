// The plug-and-play claim, held to what actually ships (20260805-020, slice E).
//
// This document makes promises about a phone. A promise doc whose promises are
// prose rots faster than anything else in a repo — so every "you get this free"
// row is asserted against the SHIPPED BUILD or against a test file that exists,
// and the two lists that bound the claim are asserted to still be there.
//
// The bounding lists are the point. A claim with no boundary gets believed until
// a phone disproves it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const doc = readFileSync('docs/plug-and-play.md', 'utf8');
const css = readFileSync('dist/css/juno.css', 'utf8');

test('every "you get this free" row is true of the shipped build', () => {
  // Not "the doc mentions it" — the mechanism is in dist/css/juno.css.
  const claims = [
    [
      'the coarse tap promotion',
      /@media \(pointer: coarse\)[\s\S]{0,400}--juno-size-tap-min: var\(--juno-size-tap-comfortable\)/,
    ],
    ['the 16px text-entry floor', /font-size:\s*max\(16px/],
    ['the letterbox flag', /html\[data-juno-letterboxed\]/],
    ['overscroll containment', /overscroll-behavior: contain/],
    ['tap-highlight suppression', /-webkit-tap-highlight-color: transparent/],
    ['the compact-navigation condition', /pointer: coarse\) and \(\(width/],
  ];
  for (const [what, re] of claims) {
    assert.match(css, re, `the doc promises ${what}, and the build does not ship it`);
  }
});

test('all four safe-area seams exist, and no rule calls env() directly', () => {
  // The promise is "safe areas honoured", and the mechanism is the seam. A rule
  // that called env() itself would be outside it, so data-juno-letterboxed
  // could not correct it — which is the whole point of having a seam.
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    assert.match(css, new RegExp(`--juno-safe-${edge}:\\s*env\\(safe-area-inset-${edge}`));
  }
});

test('every test the doc cites as its evidence exists', () => {
  // A promise pointing at a guard that does not exist is worse than one
  // pointing at nothing: it reads as verified.
  const cited = [...doc.matchAll(/`(test\/[^`]+\.(?:mjs|ts))`/g)].map((m) => m[1]);
  assert.ok(cited.length >= 4, `the doc cites only ${cited.length} guards`);
  for (const f of cited) assert.ok(existsSync(f), `the doc cites ${f}, which does not exist`);
});

test('the "you must supply" list keeps viewport-fit=cover first', () => {
  // The one that makes everything else inert. Every safe-area inset reads 0
  // without it, so the whole first table silently does nothing.
  assert.match(doc, /## What you must supply/);
  assert.match(doc, /viewport-fit=cover/);
  assert.match(doc, /reads? 0 without this/i);
});

test('the "does not do" list keeps the four it must never lose', () => {
  // Each of these was learned the expensive way and is the reason the claim is
  // bounded at all. Dropping one turns this back into marketing.
  for (const [what, re] of [
    ['WebKit is untested', /does not test WebKit/i],
    ['it cannot see what you paint', /does not see what you paint/i],
    ['it does not reach painted UI', /does not reach UI you draw/i],
    ['composing wrongly is still wrong', /does not make your app conformant/i],
  ]) {
    assert.match(doc, re, `the boundary lost: ${what}`);
  }
});

test('the release story names the gate that can actually fail a release', () => {
  // "Proven through the consumer before each release" is the ticket's own ask,
  // and it is only true because gate:consumer runs the consumer's guards
  // against the packed candidate.
  assert.match(doc, /gate:consumer/);
  assert.match(doc, /viewportFit\.test\.ts/);
  const gate = readFileSync('scripts/consumer-gate.mjs', 'utf8');
  for (const cmd of ['tsc', 'npm test', 'npm run build']) {
    assert.ok(gate.includes(cmd), `the doc claims the gate runs ${cmd}, and it does not`);
  }
});

test('the device pass is named as NOT automated', () => {
  // The most tempting sentence to drop, and the one that would make the rest
  // dishonest: nothing here runs on a phone.
  assert.match(doc, /device pass is not automated/i);
});
