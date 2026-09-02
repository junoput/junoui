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
  'It reads geometry, presence and text — never the picture. A correctly-structured page that renders wrong passes every check here; see docs/appearance.md.',
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

/** Interactive elements below the tap floor for this profile.
 *
 *  Judges the EFFECTIVE HIT AREA where one was measured, not the border box.
 *  The two differ whenever a hit area lives on a pseudo-element, in padding, or
 *  in a transparent overlapping child — and `.juno-splitter` is exactly that:
 *  a 1px painted hairline whose ::after is a 44px target. Reporting its border
 *  box called junoui's own component a defect (20260902-014).
 *
 *  The message names both when they disagree, because "44 wide, hit 12" and
 *  "12 wide" need different fixes. */
export function shortTargets({ elements, floor }) {
  return elements
    .filter((e) => {
      const w = e.hit ? e.hit.width : e.width;
      const h = e.hit ? e.hit.height : e.height;
      return Math.round(w) < floor || Math.round(h) < floor;
    })
    .map((e) => {
      const box = `${Math.round(e.width)}x${Math.round(e.height)}`;
      if (!e.hit) return `${e.label} ${box} (floor ${floor})`;
      const hit = `${Math.round(e.hit.width)}x${Math.round(e.hit.height)}`;
      return hit === box
        ? `${e.label} ${box} (floor ${floor})`
        : `${e.label} box ${box}, hit ${hit} (floor ${floor})`;
    });
}

/** Controls that occupy space and cannot be seen or tapped.
 *
 *  Reported separately from a short target because they are a different
 *  question with a different fix, and because the size check would call every
 *  one of these fine. */
export function unpaintedTargets({ elements }) {
  return elements
    .filter((e) => e.fault)
    .map((e) => `${e.label} ${Math.round(e.width)}x${Math.round(e.height)} — ${e.fault}`);
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
const COLLECT = (tapFloor) => {
  // Why an element is not on screen, or null if it is.
  //
  // `display !== 'none'` plus a non-empty rect is NOT "visible" — it is
  // "occupies space". An element can satisfy both and be invisible three ways
  // that cost nothing to check, and one of them (being covered) is the one a
  // geometry probe is most likely to certify as correct. See docs/appearance.md.
  const paintFault = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none') return 'display:none';
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') {
        return `visibility:${cs.visibility}`;
      }
      if (parseFloat(cs.opacity) === 0) return 'opacity:0';
      if (cs.contentVisibility === 'hidden') return 'content-visibility:hidden';
    }
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return 'zero-sized';

    // Covered. Sample the centre, clamped into the viewport so an element
    // straddling an edge is asked about a point that exists.
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const hit = document.elementFromPoint(cx, cy);
    // A descendant painting there is this element painting there; so is an
    // ancestor, which is what comes back when the element itself sets
    // pointer-events: none. Anything else is on top of it.
    if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
      const cls = typeof hit.className === 'string' ? hit.className.trim().split(/\s+/)[0] : '';
      return `covered at its centre by ${cls || hit.tagName.toLowerCase()}`;
    }
    return null;
  };

  const usedClasses = new Set();
  for (const el of document.querySelectorAll('[class]')) {
    for (const c of el.classList) if (/^juno-{1,2}/.test(c)) usedClasses.add(c);
  }
  // How far the element actually responds to a pointer, which is NOT its border
  // box. Probes outward from the centre and reports the furthest offset in each
  // direction that still resolves to this element.
  //
  // WHY: a hit area on a pseudo-element is invisible to getBoundingClientRect —
  // ::after cannot be measured — so `.juno-splitter`, whose element box is a
  // 1px hairline and whose ::after is a 44px target overlapping its neighbours,
  // was reported as a 1px tap target by junoui's own doctor. Padding and
  // transparent overlapping children have the same shape. See 20260902-014.
  //
  // Asymmetric in the other direction too, and that is the dangerous one: an
  // element sized 44px whose real hit area is shrunk by something on top of it
  // was reported CLEAN. This measures what a finger reaches, both ways.
  const hitExtent = (el, floor) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // The element or something inside it. NOT an ancestor: allowing one made the
    // extent leak into the parent's whole area, and a 20x20 button measured
    // 33x33 because probing past its edge hit <body>, which contains it. Found
    // by reading the probe's own numbers rather than by a test — a hit area
    // LARGER than the border box should have been impossible.
    const mine = (x, y) => {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
      const hit = document.elementFromPoint(x, y);
      return Boolean(hit) && (hit === el || el.contains(hit));
    };
    const reach = (dx, dy) => {
      const limit = Math.ceil(floor / 2);
      let out = 0;
      for (let d = 1; d <= limit; d += 1) {
        if (!mine(cx + dx * d, cy + dy * d)) break;
        out = d;
      }
      return out;
    };
    return {
      width: reach(-1, 0) + reach(1, 0) + 1,
      height: reach(0, -1) + reach(0, 1) + 1,
    };
  };

  const INTERACTIVE =
    'button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=option], [role=treeitem], [role=separator][tabindex], [tabindex]:not([tabindex="-1"])';
  const elements = [];
  let delegated = 0;
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    // A control whose pointer input is routed by a shared handler on an
    // ancestor — junoui/range's two thumbs are the case: at coincident
    // positions one thumb is entirely under the other, and which one a tap
    // grabs is decided by pickThumb, not by stacking order. Auditing its
    // individual hit area asks a question the component does not answer.
    //
    // Counted and REPORTED, never silent: an opt-out nobody can see is how an
    // audit gets muted.
    if (el.closest('[data-juno-hit="delegated"]')) {
      delegated += 1;
      continue;
    }
    const fault = paintFault(el);
    // Not laid out at all: nothing to say about it, same as before.
    if (fault === 'display:none' || fault === 'zero-sized') continue;
    const r = el.getBoundingClientRect();
    const label =
      el.getAttribute('aria-label') ||
      (el.textContent || '').trim().slice(0, 24) ||
      el.tagName.toLowerCase();
    // `fault` rides along rather than skipping the element: a control that is
    // the right SIZE and cannot be seen or tapped is exactly the thing a
    // size-only check certifies as fine.
    elements.push({
      label,
      width: r.width,
      height: r.height,
      cls: el.className,
      fault,
      // Only probed when paintFault found nothing, which already establishes
      // that the centre resolves to this element — so hitExtent needs no
      // covered-at-the-centre bail of its own. It had one; mutation showed it
      // was unreachable, and a defensive check nothing can reach is a claim
      // rather than a guard. If these two are ever decoupled, the bail comes
      // back with it.
      hit: fault ? null : hitExtent(el, tapFloor),
    });
  }
  const shown = (sel) => {
    const el = document.querySelector(sel);
    return Boolean(el) && paintFault(el) === null;
  };
  return {
    used: [...usedClasses],
    delegated,
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
    const tapFloor = profile.coarse ? 44 : 24;
    const facts = await page.evaluate(COLLECT, tapFloor);

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
    for (const t of unpaintedTargets({ elements: facts.elements })) {
      findings.push(`control is laid out but not on screen: ${t}`);
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

    results.push({
      profile: name,
      dims: `${profile.width}x${profile.height}`,
      findings,
      delegated: facts.delegated,
    });
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
    // An opt-out nobody can see is how an audit gets muted, so it is printed
    // even on a clean profile.
    if (r.delegated) {
      lines.push(
        `    · ${r.delegated} control(s) declared data-juno-hit="delegated" — not audited`,
      );
    }
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
