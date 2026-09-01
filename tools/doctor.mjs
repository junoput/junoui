#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════
//  junoui doctor — conformance probe a consumer runs against its OWN app
// ════════════════════════════════════════════════════════════════════════
//    npx junoui-doctor --url http://localhost:5173
//    npx junoui-doctor --url http://localhost:5173 --profiles phone,phone-landscape
//
//  Everything else in the conformance kit checks junoui. This checks the
//  CONSUMER — the composition junoui cannot see from inside, which is where
//  every defect in this program actually lived: a fold that could not reach
//  zero when composed with an item class, a dock whose clearance disagreed
//  with its own margin, a rail that vanished in landscape while the dock
//  vanished too.
//
//  ── WHAT IT WILL NOT DO ───────────────────────────────────────────────
//  It reports what it did NOT cover, every run, in the same block as the
//  findings. A probe that lists only failures reads as a clean bill of
//  health for the things it never looked at, and this repo has shipped that
//  mistake more than once. It cannot see WebKit (Chromium only), cannot
//  force env() on a live page, and cannot judge whether a colour means what
//  the design intended.
//
//  Playwright is a peer/optional dependency: the doctor is run by consumers
//  who already have a browser stack, and junoui does not pull one into every
//  install for a command most runs never invoke.
// ════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPACT_NAV, wantsCompactNav } from './pointer-first.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Device profiles. Real dimensions — the whole point is that round numbers
 *  hide the landscape-phone case. */
export const PROFILES = {
  phone: { width: 390, height: 844, coarse: true },
  'phone-landscape': { width: 844, height: 390, coarse: true },
  'phone-small': { width: 320, height: 568, coarse: true },
  tablet: { width: 834, height: 1112, coarse: true },
  desktop: { width: 1440, height: 900, coarse: false },
};

const DEFAULT_PROFILES = ['phone', 'phone-landscape', 'phone-small', 'desktop'];

/** What this run did not look at. Printed with the findings, never separately. */
export const LIMITS = [
  'Chromium only — it cannot tell you what WebKit does, and iOS Safari is where this org’s worst layout bugs have lived.',
  'env() is not forced: insets read 0 unless the page itself substitutes them, so safe-area arithmetic is NOT verified here.',
  'It checks what is rendered on the URL you gave it. Routes you did not visit, and states behind interaction, are uncovered.',
  'It cannot judge intent — a 44px target in the wrong place still passes.',
];

/** The manifest of classes this junoui build ships. */
export function loadManifest() {
  return JSON.parse(readFileSync(join(HERE, '..', 'dist', 'classes.json'), 'utf8'));
}

// ── the checks, as pure predicates over collected DOM facts ──────────────
// Separated from the browser so they are testable without one, and so a
// failure is a data question rather than a screenshot.

/** Every junoui class the page used that this build does not define. */
export function unknownClasses({ used, manifest, allowed = [] }) {
  const known = new Set([
    ...manifest.all,
    ...(manifest.tokens ?? []),
    ...(manifest.keyframes ?? []),
    ...(manifest.icons ?? []),
    ...allowed,
  ]);
  return used.filter((c) => !known.has(c)).sort();
}

/** Interactive elements below the tap floor for this profile. */
export function shortTargets({ elements, floor }) {
  return elements
    .filter((e) => Math.round(e.width) < floor || Math.round(e.height) < floor)
    .map((e) => `${e.label} ${Math.round(e.width)}x${Math.round(e.height)} (floor ${floor})`);
}

/** Did the page keep exactly one primary navigation? */
export function navigationVerdict({ profile, railShown, dockShown }) {
  const wantsCompact = wantsCompactNav(profile);
  if (!railShown && !dockShown) return 'no primary navigation is visible';
  if (railShown && dockShown) return 'both a rail and a dock are visible';
  if (wantsCompact && railShown) return 'a rail is showing where phone navigation belongs';
  if (!wantsCompact && dockShown) return 'a dock is showing where a rail belongs';
  return null;
}

export function parseArgs(argv) {
  const opts = { url: null, profiles: DEFAULT_PROFILES, allowed: [], json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--url') opts.url = next();
    else if (a === '--profiles')
      opts.profiles = next()
        .split(',')
        .map((s) => s.trim());
    else if (a === '--allow')
      opts.allowed.push(
        ...next()
          .split(',')
          .map((s) => s.trim()),
      );
    else if (a === '--json') opts.json = true;
    else throw new Error(`junoui doctor: unknown argument ${a}`);
  }
  if (!opts.url) throw new Error('junoui doctor: --url is required');
  const unknown = opts.profiles.filter((p) => !PROFILES[p]);
  if (unknown.length) {
    throw new Error(
      `junoui doctor: unknown profile(s) ${unknown.join(', ')} — have ${Object.keys(PROFILES).join(', ')}`,
    );
  }
  return opts;
}

/** Collected in the page. Kept in one function so what the checks see is
 *  exactly what the browser reported, with no interpretation in between. */
const COLLECT = () => {
  const usedClasses = new Set();
  for (const el of document.querySelectorAll('[class]')) {
    for (const c of el.classList) if (/^juno-{1,2}/.test(c)) usedClasses.add(c);
  }
  const INTERACTIVE =
    'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=option], [role=treeitem], [role=separator][tabindex], [tabindex]:not([tabindex="-1"])';
  const elements = [];
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue; // not rendered
    if (getComputedStyle(el).display === 'none') continue;
    const label =
      el.getAttribute('aria-label') ||
      (el.textContent || '').trim().slice(0, 24) ||
      el.tagName.toLowerCase();
    elements.push({ label, width: r.width, height: r.height, cls: el.className });
  }
  const shown = (sel) => {
    const el = document.querySelector(sel);
    return Boolean(el) && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  };
  return {
    used: [...usedClasses],
    elements,
    railShown: shown('.juno-rail'),
    dockShown: shown('.juno-dock, .juno-pillbar'),
    overflowsInline:
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    coarse: matchMedia('(pointer: coarse)').matches,
    tapMin: parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--juno-size-tap-min'),
    ),
  };
};

export async function runDoctor(opts, { chromium }) {
  const manifest = loadManifest();
  const browser = await chromium.launch();
  const results = [];

  for (const name of opts.profiles) {
    const profile = PROFILES[name];
    const ctx = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      hasTouch: profile.coarse,
      isMobile: profile.coarse,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(opts.url, { waitUntil: 'networkidle' });
    const facts = await page.evaluate(COLLECT);

    // The emulation is proven before its readings are used. If hasTouch stopped
    // making (pointer: coarse) match, every touch finding below would be
    // computed against a desktop page and the run would look clean.
    const findings = [];
    if (facts.coarse !== profile.coarse) {
      findings.push(
        `the pointer emulation did not apply — this profile measured nothing about touch`,
      );
    }

    const floor = Number.isFinite(facts.tapMin) ? facts.tapMin : profile.coarse ? 44 : 24;
    for (const t of shortTargets({ elements: facts.elements, floor })) {
      findings.push(`tap target below the floor: ${t}`);
    }
    for (const c of unknownClasses({ used: facts.used, manifest, allowed: opts.allowed })) {
      findings.push(`class junoui does not define: ${c}`);
    }
    const nav = navigationVerdict({
      profile,
      railShown: facts.railShown,
      dockShown: facts.dockShown,
    });
    if (nav) findings.push(`navigation: ${nav}`);
    if (facts.overflowsInline) {
      findings.push(`the page scrolls horizontally (${facts.scrollWidth} > ${facts.clientWidth})`);
    }

    results.push({ profile: name, dims: `${profile.width}x${profile.height}`, findings });
    await ctx.close();
  }

  await browser.close();
  return { url: opts.url, junoui: manifest.version, results, limits: LIMITS };
}

export function report(run) {
  const lines = [`junoui doctor ${run.junoui} — ${run.url}`, ''];
  let total = 0;
  for (const r of run.results) {
    total += r.findings.length;
    lines.push(`${r.findings.length ? '✗' : '✓'} ${r.profile} (${r.dims})`);
    for (const f of r.findings) lines.push(`    ${f}`);
  }
  lines.push('', 'NOT COVERED BY THIS RUN:');
  for (const l of run.limits) lines.push(`  · ${l}`);
  lines.push('', total ? `${total} finding(s).` : 'No findings.');
  return { text: lines.join('\n'), total };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      'junoui doctor: playwright is not installed. It is an optional peer —\n' +
        '  npm i -D playwright && npx playwright install chromium',
    );
    process.exit(2);
  }
  const run = await runDoctor(opts, { chromium });
  const out = report(run);
  console.log(opts.json ? JSON.stringify(run, null, 2) : out.text);
  process.exit(out.total ? 1 : 0);
}
