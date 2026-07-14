// WCAG 2.2 contrast audit for junoui color tokens.
// Reads tokens/color/*.json, resolves oklch→sRGB via color.mjs, computes
// WCAG relative-luminance contrast ratios for every meaningful pair.
// Run: node scripts/audit-contrast.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { oklchToHex } from './color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const hexOf = (v) => (v.startsWith('#') ? v.toUpperCase() : oklchToHex(v));

// WCAG relative luminance from sRGB hex.
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const chan = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
const ratio = (a, b) => {
  const [la, lb] = [luminance(a), luminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
const r2 = (x) => Math.round(x * 100) / 100;

function loadPalette(name) {
  const j = JSON.parse(readFileSync(resolve(root, `tokens/color/${name}.json`), 'utf8'));
  const p = j.color[name];
  const out = {};
  for (const theme of ['dark', 'light']) {
    out[theme] = {};
    for (const [k, v] of Object.entries(p[theme])) {
      if (v && v.$value) out[theme][k] = hexOf(v.$value);
    }
  }
  return out;
}

const palettes = ['standard', 'soft', 'colorblind'].map((n) => [n, loadPalette(n)]);

const surfaces = ['s0', 's1', 's2', 's3'];
const textRoles = ['data', 'label', 'muted', 'data-dim'];
const statusRoles = ['nominal', 'active', 'target', 'caution', 'warning'];

// thresholds
const AA_TEXT = 4.5;
const AAA_TEXT = 7.0;
const AA_LARGE = 3.0;
const NONTEXT = 3.0; // 1.4.11

function flag(v, threshold) {
  return v >= threshold ? 'PASS' : 'FAIL';
}

for (const [name, pal] of palettes) {
  for (const theme of ['dark', 'light']) {
    const c = pal[theme];
    console.log(`\n════ ${name} / ${theme} ════`);

    // Text: data (claims AAA on s0-s2), label (claims AA)
    console.log('  -- text on surfaces (AA 4.5 / AAA 7.0) --');
    for (const role of textRoles) {
      if (!c[role]) continue;
      const row = surfaces
        .map((s) => {
          const v = r2(ratio(c[role], c[s]));
          const lvl =
            v >= AAA_TEXT ? 'AAA' : v >= AA_TEXT ? 'AA' : v >= AA_LARGE ? 'AA-lg' : 'FAIL';
          return `${s}:${v}(${lvl})`;
        })
        .join('  ');
      console.log(`     ${role.padEnd(9)} ${row}`);
    }

    // Status roles used as text/values
    console.log('  -- status roles on surfaces (AA 4.5) --');
    for (const role of statusRoles) {
      if (!c[role]) continue;
      const row = surfaces
        .map((s) => {
          const v = r2(ratio(c[role], c[s]));
          const lvl =
            v >= AAA_TEXT ? 'AAA' : v >= AA_TEXT ? 'AA' : v >= AA_LARGE ? 'AA-lg' : 'FAIL';
          return `${s}:${v}(${lvl})`;
        })
        .join('  ');
      console.log(`     ${role.padEnd(9)} ${row}`);
    }

    // Non-text: focus ring (active), borders vs surfaces (1.4.11 >=3)
    console.log('  -- non-text vs surfaces (1.4.11 AA >=3.0) --');
    for (const role of ['active', 'border', 'border-strong']) {
      if (!c[role]) continue;
      const row = surfaces
        .map((s) => {
          const v = r2(ratio(c[role], c[s]));
          return `${s}:${v}(${flag(v, NONTEXT)})`;
        })
        .join('  ');
      console.log(`     ${role.padEnd(13)} ${row}`);
    }

    // Surface-to-surface separation (the "blocks vs background" concern)
    console.log('  -- adjacent surface separation (informational) --');
    const pairs = [
      ['s1', 's0'],
      ['s2', 's1'],
      ['s3', 's2'],
      ['s2', 's0'],
    ];
    console.log('     ' + pairs.map(([a, b]) => `${a}/${b}:${r2(ratio(c[a], c[b]))}`).join('   '));
  }
}
