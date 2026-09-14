// Relative links and anchors in the SHIPPED docs (20260914-105).
//
// `docs/` is in package.json's `files`, so every one of these resolves inside a
// consumer's `node_modules`. A dead link there is not a tidiness problem — it is
// a broken path in a published artefact, and nothing checked any of them.
//
// FOUND BY RUNNING IT: `icon-loader.md` pointed at `./loader.md#arc` while the
// heading is `## Arc — circular ring`, whose slug is `arc--circular-ring`. One
// dead anchor out of 73, and it had been there long enough that nobody noticed.
//
// ── THE SLUG RULE IS THE WHOLE TEST, AND GETTING IT WRONG COSTS MORE THAN THE
//    GAP ──────────────────────────────────────────────────────────────────────
//
// The first version of this checker collapsed runs of whitespace before
// hyphenating. GitHub does not: it strips non-word characters and then replaces
// EACH remaining space with a hyphen, so `## Density & text spacing` becomes
// `density--text-spacing` with two hyphens where the `&` was.
//
// That one difference reported NINE dead anchors where there is one. Eight
// correct links, all failing in the same direction — the signature of a lossy
// extractor rather than eight bad links — and "fixing" them would have replaced
// eight working anchors with broken ones.
//
// So the rule below is written to match GitHub's, and the test asserts a known
// double-hyphen anchor resolves. Without that assertion a future simplification
// of the slug rule passes every link by being wrong in the same direction as the
// documents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

/** Every markdown file a consumer receives, plus the repo's own top-level set. */
function docFiles() {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk('docs');
  for (const f of ['README.md', 'CONTRIBUTING.md', 'RELEASING.md']) if (existsSync(f)) out.push(f);
  return out;
}

/**
 * GitHub's heading-to-anchor rule.
 *
 * Lowercase; drop everything that is not a word character, whitespace or a
 * hyphen; then replace each remaining SPACE with a hyphen. The last step is
 * per-character — runs are NOT collapsed, which is why a heading containing
 * `&` or an em dash produces a double hyphen.
 */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/ /g, '-');

const FILES = docFiles();
const HEADINGS = new Map(
  FILES.map((f) => [
    f,
    new Set(
      [...readFileSync(f, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1].trim())),
    ),
  ]),
);

test('the docs were really walked and really parsed (vacuity floor)', () => {
  // Without this, a renamed directory makes every assertion below iterate an
  // empty list and pass — 0 links checked and 0 broken are indistinguishable
  // from a clean tree.
  assert.ok(FILES.length >= 30, `only ${FILES.length} markdown files walked`);
  const totalHeadings = [...HEADINGS.values()].reduce((n, s) => n + s.size, 0);
  assert.ok(totalHeadings >= 200, `only ${totalHeadings} headings parsed`);
});

test('the slug rule matches GitHub, including the double-hyphen case', () => {
  // The control that makes the link checks mean anything. A simplified rule that
  // collapses whitespace passes every link in the repo while being wrong, and
  // reported eight working anchors as dead when it was the checker at fault.
  assert.equal(slug('Density & text spacing'), 'density--text-spacing');
  assert.equal(slug('Arc — circular ring'), 'arc--circular-ring');
  assert.equal(slug('Max vs addition — the rule'), 'max-vs-addition--the-rule');
  assert.equal(slug('Progress API'), 'progress-api');
});

test('every relative link in the shipped docs points at a file that exists', () => {
  const broken = [];
  let checked = 0;
  for (const f of FILES) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\((\.[^)#\s]*)(#[^)\s]*)?\)/g)) {
      checked++;
      if (!existsSync(resolve(dirname(f), m[1]))) broken.push(`${f} -> ${m[1]}`);
    }
  }
  assert.ok(checked >= 200, `only ${checked} relative links found — suspect the regex`);
  assert.deepEqual(broken, [], 'a shipped doc links to a file that does not exist');
});

/**
 * Every `.juno-*` class the stylesheets declare.
 *
 * Reads all of `src/css` rather than only `components/`, because a class can be
 * declared in `utilities.css` or `layout.css` and used in a component's doc.
 */
function definedClasses() {
  let css = '';
  for (const d of ['src/css', 'src/css/components']) {
    for (const f of readdirSync(d)) if (f.endsWith('.css')) css += readFileSync(join(d, f), 'utf8');
  }
  return new Set([...css.matchAll(/\.(juno-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
}

/**
 * Every `juno-` class named in a doc example OR in a showcase page.
 *
 * THE SHOWCASE IS INCLUDED AND THE DOCS' LINK CHECKS ARE NOT — the two ask
 * different questions. A relative href between showcase pages is that demo's
 * business; a CLASS that does not exist is a broken reference implementation,
 * and `scroll-region-tabstop.test.mjs` already settled why that matters here:
 * "junoui ships CSS, not markup, so no test can force a consumer to do this.
 * But the showcase is the thing people copy, and an unguarded reference
 * implementation teaches the omission."
 *
 * Same argument, one attribute over. The showcase was clean when this widened
 * — zero undefined parts or modifiers across 28 pages — so this guards a state
 * rather than fixing one.
 */
function classesInExamples() {
  const out = [];
  for (const f of FILES) {
    for (const block of readFileSync(f, 'utf8').matchAll(/```html\n([\s\S]*?)```/g)) {
      for (const attr of block[1].matchAll(/class="([^"]+)"/g)) {
        for (const c of attr[1].split(/\s+/)) if (c.startsWith('juno-')) out.push({ file: f, c });
      }
    }
  }
  for (const f of showcasePages()) {
    for (const attr of readFileSync(f, 'utf8').matchAll(/class="([^"]+)"/g)) {
      for (const c of attr[1].split(/\s+/)) if (c.startsWith('juno-')) out.push({ file: f, c });
    }
  }
  return out;
}

/** Every showcase page, walked rather than listed — the seventh scroll region
 *  was missed because a sibling test enumerated pages by hand (20260909-091). */
function showcasePages() {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  walk('showcase');
  return out;
}

test('the doc examples and showcase pages were really read (vacuity floor)', () => {
  const used = classesInExamples();
  assert.ok(used.length >= 400, `only ${used.length} juno- classes found in examples`);
  assert.ok(showcasePages().length >= 20, `only ${showcasePages().length} showcase pages walked`);
  assert.ok(definedClasses().size >= 300, 'the stylesheets parsed suspiciously few classes');
});

test('every PART or MODIFIER a doc example names exists in the CSS', () => {
  // `docs/` ships, so a consumer copies these out of node_modules. A modifier
  // that does not exist is worse than a dead link: the markup is valid, the
  // element renders, and only the appearance is silently not what the caption
  // promises. Found that way — `icon-loader.md` offered `.juno-btn--icon` under
  // a "40px circular icon button" caption, and it existed nowhere but that line
  // (20260914-108).
  //
  // A BARE BLOCK IS DELIBERATELY EXEMPT, and that exemption is the difference
  // between one finding and one finding plus a false positive. `tabs.md` uses
  // `class="juno-tabs"` while `tabs.css` declares only `__list`, `__tab` and
  // `__panel` — the block is a wrapper whose parts carry every rule. Requiring
  // it to exist would push a meaningless declaration into the stylesheet to
  // satisfy a test.
  const defined = definedClasses();
  const missing = classesInExamples()
    .filter(({ c }) => /--|__/.test(c) && !defined.has(c))
    .map(({ file, c }) => `${file}: ${c}`);
  assert.deepEqual(
    missing,
    [],
    'a shipped doc example names a part or modifier the CSS does not declare. ' +
      'Either the example is wrong or the class was renamed; check the component ' +
      'stylesheet for the real name rather than adding the class to match the doc.',
  );
});

test('every anchor in the shipped docs points at a heading that exists', () => {
  const broken = [];
  let checked = 0;
  for (const f of FILES) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\]\((\.[^)#\s]*)?(#[^)\s]+)\)/g)) {
      checked++;
      const key = relative(process.cwd(), m[1] ? resolve(dirname(f), m[1]) : f);
      const headings = HEADINGS.get(key);
      if (!headings) broken.push(`${f} -> ${m[1] ?? ''}${m[2]}  (no such file)`);
      else if (!headings.has(m[2].slice(1).toLowerCase()))
        broken.push(`${f} -> ${m[1] ?? ''}${m[2]}`);
    }
  }
  assert.ok(checked >= 50, `only ${checked} anchors found — suspect the regex`);
  assert.deepEqual(
    broken,
    [],
    'a shipped doc points at a heading that does not exist. Check the HEADING ' +
      'before editing the link: a heading like "## Arc — circular ring" slugs to ' +
      '"arc--circular-ring", not "arc".',
  );
});
