// Build-integrity tests. Assumes `npm run build` has run (npm test does it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { TOKENS, CORE, getTokens } from '../dist/js/tokens.js';
import { buildReference, REFERENCE_PATH } from '../scripts/gen-docs.mjs';

const PALETTES = ['standard', 'colorblind', 'soft'];
const MODES = ['dark', 'light'];
const ROLES = [
  'nominal',
  'active',
  'target',
  'caution',
  'warning',
  'data',
  'data-dim',
  'label',
  'muted',
  'border',
  'border-strong',
  's0',
  's1',
  's2',
  's3',
];

test('every platform output exists and is non-empty', () => {
  const outputs = [
    'dist/css/juno.css',
    'dist/css/juno-tokens.css',
    'dist/scss/_juno-tokens.scss',
    'dist/js/tokens.js',
    'dist/js/tokens.d.ts',
    'dist/json/tokens.json',
    'dist/android/colors.xml',
    'dist/android/dimens.xml',
    'dist/ios/JunoTokens.swift',
    'dist/flutter/juno_tokens.dart',
  ];
  for (const f of outputs) {
    assert.ok(existsSync(f), `missing ${f}`);
    assert.ok(readFileSync(f, 'utf8').trim().length > 0, `empty ${f}`);
  }
});

test('every package export resolves to a real file', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const [key, val] of Object.entries(pkg.exports)) {
    const f = typeof val === 'string' ? val : val.import;
    assert.ok(existsSync(f), `export "${key}" → ${f} missing`);
  }
});

test('JS token model has full palette × mode × role coverage', () => {
  for (const p of PALETTES) {
    for (const m of MODES) {
      for (const role of ROLES) {
        assert.ok(TOKENS[p][m][role], `TOKENS.${p}.${m}.${role} missing`);
      }
    }
  }
  assert.equal(getTokens('colorblind', 'light').warning, '#BA4300');
  assert.equal(CORE.space['16'], '16px');
  assert.equal(CORE.bp['2xl'], '1536px');
});

test('every var(--juno-*) used in src/css is defined in the token output', () => {
  const tokens = readFileSync('dist/css/juno-tokens.css', 'utf8');
  const defined = new Set([...tokens.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));
  // runtime / component-local props set in-component or by the consumer:
  const local = new Set([
    'juno-role',
    'juno-font-scale',
    'juno-icon-size',
    'juno-skeleton-h',
    'juno-avatar-size',
    'juno-stepper-marker',
    'juno-slider-pct',
    'juno-control-surface',
    'juno-control-edge',
    'juno-control-edge-strong',
    'juno-knob-edge',
    'juno-knob-face-hi',
    'juno-knob-face-lo',
    'juno-knob-grip',
    'juno-pad-control-block',
    'juno-pad-control-inline',
    'juno-pad-surface-block',
    'juno-pad-surface-inline',
    'juno-gap-control',
    'juno-tile-min',
    'juno-gap-content',
    'juno-gauge-value',
    'juno-gauge-size',
    'juno-gauge-width',
    'juno-rail-width',
    'juno-thumb-glyph',
    'juno-progress',
    'juno-arc-size',
    'juno-arc-width',
    'juno-beacon-size',
    'juno-beacon-fill-stop',
    'juno-measure',
    'juno-stack-space',
    'juno-cluster-align',
    'juno-cluster-space',
    'juno-grid-space',
    'juno-grid-min',
    'juno-sidebar-space',
    'juno-sidebar-width',
    'juno-sidebar-content-min',
    'juno-switcher-space',
    'juno-switcher-threshold',
    'juno-reel-space',
    'juno-table-fill',
    'juno-cell-max',
    'juno-app-shell-topbar-size',
    'juno-icon-loader-ring',
    'juno-icon-loader-ring-width',
    'juno-dock-clearance',
    'juno-pillbar-clearance',
    'juno-motion',
    'juno-motion-scale',
    'juno-thumb-ratio',
    'juno-skeleton-ratio',
    'juno-scroller-overflow',
    'juno-scroller-overscroll',
    'juno-scroller-snap',
    'juno-snap-align',
    'juno-sheet-h',
    'juno-sheet-max',
    'juno-dock-scale',
    'juno-pillbar-item',
    'juno-pillbar-gap',
    'juno-pillbar-pad',
    'juno-pillbar-edge',
  ]);
  const files = [
    'src/css/base.css',
    'src/css/utilities.css',
    'src/css/layout.css',
    ...readdirSync('src/css/components').map((f) => `src/css/components/${f}`),
  ];
  const used = new Set();
  for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/var\(--([\w-]+)/g)) used.add(m[1]);
  }
  const missing = [...used].filter((v) => !defined.has(v) && !local.has(v));
  assert.deepEqual(missing, [], `undefined vars: ${missing.join(', ')}`);
});

test('env() safe-area fallbacks inside calc() carry a length unit', () => {
  // Regression guard: a unitless `0` fallback is a <number>, not a <length>, so
  // `calc(... + env(safe-area-inset-*, 0))` is an invalid sum and the whole
  // DECLARATION is dropped (it does not evaluate to zero — the property simply
  // never applies). Fallbacks must be unit-bearing (0px). See 20260802-016.
  // Bare (non-calc) property values may keep a unitless 0.
  const files = [
    'src/css/base.css',
    'src/css/utilities.css',
    'src/css/layout.css',
    ...readdirSync('src/css/components').map((f) => `src/css/components/${f}`),
  ];
  const unitlessEnv = /env\(\s*safe-area-inset-[a-z]+\s*,\s*-?\d*\.?\d+\s*\)/g;
  const bad = [];
  for (const f of files) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (!line.includes('calc(')) return;
        for (const m of line.matchAll(unitlessEnv)) bad.push(`${f}:${i + 1}  ${m[0].trim()}`);
      });
  }
  assert.deepEqual(bad, [], `unitless env() fallback inside calc():\n${bad.join('\n')}`);
});

test('every showcase page opts into the safe area with viewport-fit=cover', () => {
  // On iOS, `viewport-fit` defaults to `auto` and WebKit gates the safe-area
  // insets on `cover` — so without this meta EVERY env(safe-area-inset-*) in the
  // library resolves to 0 and the showcase silently stops demonstrating the
  // thing it exists to demonstrate. `contain` does NOT opt out; only `cover`.
  // See ticket 20260803-028 and docs/ios-conformance.md.
  const pages = readdirSync('showcase').filter((f) => f.endsWith('.html'));
  assert.ok(pages.length > 0, 'no showcase pages found');
  const missing = pages.filter((p) => {
    const meta = readFileSync(`showcase/${p}`, 'utf8').match(/<meta\s+name="viewport"[^>]*>/i);
    return !meta || !/viewport-fit\s*=\s*cover/i.test(meta[0]);
  });
  assert.deepEqual(missing, [], `showcase pages missing viewport-fit=cover: ${missing.join(', ')}`);
});

test('committed token reference is up to date', () => {
  const current = readFileSync(REFERENCE_PATH, 'utf8');
  assert.equal(current, buildReference(), 'run `npm run gen-docs` and commit');
});
