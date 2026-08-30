#!/usr/bin/env node
// The pre-release consumer gate — ticket 20260815-007 (slice D of 20260805-020).
//
// WHAT IT IS. junoui's own CI proves junoui builds. Nothing in it proves a
// junoui *release* still compiles into an app that consumes it, and until this
// script existed a version reached the registry having never been built into
// one. Two releases in the week of 2026-08-08 shipped defects that only a
// consumer build could see:
//
//   * 0.4.0 shipped WITHOUT tools/subset-sprite.mjs while nexora's
//     vite.config.ts does `import { subsetSprite } from 'junoui/subset'`. The
//     export was added to package.json `exports` and the directory was never
//     added to `files`, so the entry existed and resolved to nothing. Caught by
//     hand, minutes before a merge that would have broken nexora's develop.
//   * The icon subsetting work found two icon names nexora draws that junoui's
//     sprite does not define (`cloud-slash`, and `image` where junoui ships
//     `images`). Both rendered as an empty <svg> in the app. Nobody had noticed.
//
// Neither is visible from inside this repo. Both are one consumer build away.
//
// WHY IT PACKS RATHER THAN LINKS — the single most important line here. The
// candidate is `npm pack`ed and the TARBALL is installed. A symlink or a
// `file:` install resolves the whole worktree, so `tools/subset-sprite.mjs`
// would have been present in a candidate that did not ship it: a linked gate
// passes the exact release this one exists to stop. What a consumer receives is
// a tarball, so a tarball is what gets tested — file list, exports map and
// built dist together.
//
// WHERE IT WRITES. Everything lives under <junoui>/.relgate (gitignored): the
// staged pack source, the candidate tarball, and a throwaway shallow clone of
// the consumer. It NEVER writes to /work/ios/nexora — that worktree is the live
// integration environment behind the operator's :20100 UI, and a stray
// `npm install` in it is immediately visible. The paths are asserted, not
// merely intended; see assertInsideLane().
//
// Usage:
//   node scripts/consumer-gate.mjs                 # full gate
//   node scripts/consumer-gate.mjs --keep          # keep the clone/tarball
//   node scripts/consumer-gate.mjs --dev           # consumer check mid-development:
//                                                  # an already-published version
//                                                  # reports instead of blocking
//   node scripts/consumer-gate.mjs --drop-files tools
//                                                  # ACCEPTANCE ONLY: pack a
//                                                  # candidate reproducing the
//                                                  # 0.4.0 defect and prove the
//                                                  # gate goes red on it.
// Exit code is 0 only if every stage passed. A red gate BLOCKS the release.

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { baselineVerdict } from './gate-currency.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(REPO, '.relgate');
const STAGE = join(WORK, 'pack-src');
const CONSUMER = join(WORK, 'nexora');

const DEFAULTS = {
  repo: 'git@github.com:junoput/nexora.git',
  ref: 'ios/develop',
  // The branch `ref` is a lane OF. A lane far behind this is a consumer
  // snapshot, not the consumer — see the currency check below.
  baseline: 'develop',
  // The consumer's package directory — where package.json / node_modules live.
  subdir: 'web',
  // The dependency name in the consumer. nexora aliases the scoped package to
  // a bare `junoui`, so the tarball must be installed under that folder name.
  as: 'junoui',
};

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const opts = { ...DEFAULTS, keep: false, dropFiles: [], build: true, dev: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  if (a === '--keep') opts.keep = true;
  else if (a === '--no-build') opts.build = false;
  else if (a === '--dev') opts.dev = true;
  else if (a === '--repo') opts.repo = next();
  else if (a === '--ref') opts.ref = next();
  else if (a === '--baseline') opts.baseline = next();
  else if (a === '--no-baseline-check') opts.baseline = null;
  else if (a === '--subdir') opts.subdir = next();
  else if (a === '--as') opts.as = next();
  else if (a === '--drop-files') opts.dropFiles.push(next());
  else if (a === '-h' || a === '--help') {
    const src = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
    console.log(src.slice(1, src.indexOf('')).join('\n'));
    process.exit(0);
  } else {
    console.error(`consumer-gate: unknown argument ${a}`);
    process.exit(2);
  }
}

// ------------------------------------------------------------------- output

const results = [];
let stageNo = 0;

function head(title) {
  stageNo++;
  console.log(`\n\x1b[1m── ${stageNo}. ${title}\x1b[0m`);
}
function record(name, ok, note = '') {
  results.push({ name, ok, note });
  console.log(
    `${ok ? '\x1b[32m   PASS\x1b[0m' : '\x1b[31m   FAIL\x1b[0m'}  ${name}${note ? ` — ${note}` : ''}`,
  );
}
function die(msg) {
  console.error(`\n\x1b[31mconsumer-gate: ${msg}\x1b[0m`);
  process.exit(2);
}

function run(cmd, args, cwd, { capture = false, allowFail = false } = {}) {
  const shown = `${cmd} ${args.join(' ')}`;
  console.log(`\x1b[2m   $ ${shown}   (${relative(REPO, cwd) || '.'})\x1b[0m`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    env: process.env,
  });
  if (r.error) die(`${shown}: ${r.error.message}`);
  if (r.status !== 0 && !allowFail) die(`${shown} exited ${r.status}`);
  return { code: r.status, out: (r.stdout ?? '').trim() };
}

// -------------------------------------------------------------- containment

// Nothing this script writes may live outside <junoui>/.relgate. The failure
// mode being guarded is not a typo — it is the temptation to reuse the live
// /work/ios/nexora worktree because it is already installed.
function assertInsideLane(p, what) {
  const root = realpathSync(REPO);
  const sandbox = join(root, '.relgate');
  const target = resolve(p);
  if (target !== sandbox && !target.startsWith(sandbox + sep)) {
    die(`refusing to write ${what} at ${target} — outside ${sandbox}`);
  }
  // A symlink would let a path inside the sandbox write outside it, which is
  // precisely how a "throwaway" checkout becomes /work/ios/nexora.
  if (existsSync(target)) {
    if (lstatSync(target).isSymbolicLink())
      die(`${what} at ${target} is a symlink; refusing to follow it`);
    const real = realpathSync(target);
    if (real !== sandbox && !real.startsWith(sandbox + sep)) {
      die(`${what} at ${target} resolves outside the sandbox (${real})`);
    }
  }
}

// ------------------------------------------------------------------- stages

console.log(`\x1b[1mjunoui consumer gate\x1b[0m`);
const junouiPkg = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8'));
const junouiSha = run('git', ['rev-parse', 'HEAD'], REPO, { capture: true }).out;
console.log(`   candidate : ${junouiPkg.name}@${junouiPkg.version}  (${junouiSha.slice(0, 8)})`);
console.log(`   consumer  : ${opts.repo} @ ${opts.ref}  [${opts.subdir}]`);
if (opts.dropFiles.length) {
  console.log(
    `\x1b[33m   SABOTAGE  : packing WITHOUT ${opts.dropFiles.join(', ')} — this run is expected to go red\x1b[0m`,
  );
}

assertInsideLane(WORK, 'work directory');
mkdirSync(WORK, { recursive: true });

// 1. Build, then stage a pack source.
//
// `npm publish` packs what `prepare` produced, so the gate builds first and
// then packs with --ignore-scripts from a COPY. The copy is what makes
// --drop-files safe: the real package.json is never edited, so an interrupted
// run cannot leave a mutilated manifest behind.
// ---------------------------------------------------- release-state preflight
// After a changesets release, `main` is the only branch that knows the version
// moved: the action versions package.json and DELETES the consumed changesets
// there. Every other branch keeps both — so a branch that has not taken main
// back is one `changeset version` away from computing a version off a stale
// base and republishing a CHANGELOG that already shipped.
//
// Found on 2026-08-15, minutes after 0.6.0 published: develop and ios/develop
// both still read 0.5.0 and still carried all five consumed changesets
// (20260815-053). Nothing was broken yet; the next release would have been.
//
// This asserts rather than advises, because the alternative is prose in
// RELEASING.md that has to be remembered at the exact moment nobody is reading
// documentation. Two checks, both offline except the optional registry one:
//   1. origin/main is an ancestor of HEAD — i.e. this branch carries whatever
//      the last release did to main.
//   2. the version here is not already on the registry. Skipped without
//      network rather than failing, since a gate that cannot run offline stops
//      being run at all.
head('preflight — this branch has taken back the last release');
{
  const fetched = run('git', ['fetch', '--quiet', 'origin', 'main'], REPO, { allowFail: true });
  if (fetched.code !== 0) {
    record('origin/main is an ancestor of HEAD', true, 'skipped — could not fetch origin/main');
  } else {
    const contains = run('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], REPO, {
      allowFail: true,
    });
    record(
      'origin/main is an ancestor of HEAD',
      contains.code === 0,
      contains.code === 0
        ? ''
        : "merge origin/main first — it carries the last release's version bump and the changesets that release consumed",
    );
  }

  const published = run(
    'npm',
    ['view', `${junouiPkg.name}@${junouiPkg.version}`, 'version'],
    REPO,
    {
      capture: true,
      allowFail: true,
    },
  );
  if (published.code !== 0) {
    record('this version is not already published', true, 'skipped — registry unreachable');
  } else {
    const stale = published.out.trim() === junouiPkg.version;
    // --dev: you are checking a consumer build mid-development, not cutting a
    // release. The unversioned-candidate condition is then expected and says
    // nothing, so it reports without blocking. Without the flag it is fatal,
    // because packing a version that is already on the registry means the
    // candidate under test is not the artifact you would publish.
    record(
      'this version is not already published',
      stale ? Boolean(opts.dev) : true,
      stale
        ? opts.dev
          ? `${junouiPkg.version} is already published — fine under --dev, fatal for a release`
          : `${junouiPkg.version} is already on the registry — run \`changeset version\` before packing (or pass --dev if you are not releasing)`
        : '',
    );
  }
}

head(opts.build ? 'build the candidate' : 'build the candidate (skipped)');
if (opts.build) run('npm', ['run', 'build'], REPO);
if (!existsSync(join(REPO, 'dist'))) die('no dist/ — run without --no-build');

head('stage a pack source (never mutates the working tree)');
assertInsideLane(STAGE, 'pack stage');
rmSync(STAGE, { recursive: true, force: true });
const SKIP = new Set(['node_modules', '.git', '.relgate', 'test-results', 'playwright-report']);
mkdirSync(STAGE, { recursive: true });
// Entry by entry rather than cpSync(REPO, STAGE): the stage lives inside the
// repo, and node refuses to copy a directory into a subdirectory of itself.
for (const entry of readdirSync(REPO)) {
  if (SKIP.has(entry)) continue;
  cpSync(join(REPO, entry), join(STAGE, entry), { recursive: true, dereference: false });
}
if (opts.dropFiles.length) {
  const p = join(STAGE, 'package.json');
  const staged = JSON.parse(readFileSync(p, 'utf8'));
  staged.files = staged.files.filter((f) => !opts.dropFiles.includes(f));
  writeFileSync(p, JSON.stringify(staged, null, 2) + '\n');
  console.log(`   staged files: ${staged.files.join(', ')}`);
}
record('pack source staged', true, relative(REPO, STAGE));

// 2. Pack. This is the artefact a consumer receives.
head('pack the candidate');
const packed = run('npm', ['pack', '--ignore-scripts', '--pack-destination', WORK], STAGE, {
  capture: true,
});
const tgz = join(WORK, packed.out.split('\n').pop().trim());
if (!existsSync(tgz)) die(`npm pack produced no tarball (${packed.out})`);
record('candidate packed', true, relative(REPO, tgz));

// 3. Preflight: every exports target must actually be IN the tarball.
//
// This is the 0.4.0 defect stated directly — an exports entry whose file the
// `files` list does not ship. It is cheap and it is not the whole gate: the
// consumer build below is what catches the things a manifest cannot describe.
head('preflight — the exports map resolves inside the tarball');
const listing = run('tar', ['-tzf', tgz], WORK, { capture: true }).out.split('\n');
const shipped = new Set(listing.map((l) => l.replace(/^package\//, '').replace(/\/$/, '')));
const targets = [];
const walk = (node) => {
  if (typeof node === 'string') targets.push(node);
  else if (node && typeof node === 'object') Object.values(node).forEach(walk);
};
walk(junouiPkg.exports);
const missing = [...new Set(targets)]
  .map((t) => t.replace(/^\.\//, ''))
  .filter((t) => !shipped.has(t));
record(
  'every exports target is present in the tarball',
  missing.length === 0,
  missing.length
    ? `missing: ${missing.join(', ')}`
    : `${targets.length} entries, ${shipped.size} files`,
);

// 4. Throwaway consumer checkout. Shallow, in-lane, refreshed each run.
head('fetch the consumer');
assertInsideLane(CONSUMER, 'consumer checkout');
if (existsSync(join(CONSUMER, '.git'))) {
  run('git', ['fetch', '--depth', '1', 'origin', opts.ref], CONSUMER);
  run('git', ['reset', '--hard', 'FETCH_HEAD'], CONSUMER);
  run('git', ['clean', '-fd', '-e', 'node_modules'], CONSUMER);
} else {
  rmSync(CONSUMER, { recursive: true, force: true });
  run('git', ['clone', '--depth', '1', '--branch', opts.ref, opts.repo, CONSUMER], WORK);
}
const consumerSha = run('git', ['rev-parse', 'HEAD'], CONSUMER, { capture: true }).out;
const pkgDir = join(CONSUMER, opts.subdir);
if (!existsSync(join(pkgDir, 'package.json'))) die(`no package.json in ${pkgDir}`);
record('consumer checked out', true, `${opts.ref} @ ${consumerSha.slice(0, 8)}`);

// 4b. IS THIS CONSUMER STILL THE CONSUMER?
//
// The gate's claim is that a candidate "compiles into an app that consumes it".
// It checks out a LANE by default, and a lane drifts: on 2026-08-26 this
// reported GATE GREEN twice against a nexora ios/develop 260 commits behind its
// own develop. The guard that would have failed — dockClearance.test.ts,
// reading the shipped juno.css — did not exist on that branch yet. So the gate
// proved "this candidate builds against a consumer snapshot from some weeks
// ago", which is not the claim RELEASING.md makes for it (20260826-039).
//
// The remedy is the shape junoui already runs on ITSELF one section up: assert
// the branch has taken its baseline back.
//
// Shallow clones make the comparison awkward, handled explicitly: with depth 1
// on both sides there is no common history, so the fetch deepens until
// merge-base can answer. If it still cannot, this FAILS — see baselineVerdict.
if (opts.baseline && opts.baseline !== opts.ref) {
  head('the consumer is current with its own baseline');
  let outcome = null;
  for (const depth of [50, 500, 0]) {
    // EXPLICIT REFSPECS. The checkout is cloned with `--branch <ref>`, whose
    // refspec maps that one branch only — so `git fetch origin develop` sets
    // FETCH_HEAD and creates no `origin/develop` to compare against, and every
    // comparison finds nothing. That is how this check reported "could not
    // compare" on its own first run.
    const spec = [opts.ref, opts.baseline].map((b) => `+refs/heads/${b}:refs/remotes/origin/${b}`);
    const args = depth
      ? ['fetch', '--depth', String(depth), 'origin', ...spec]
      : ['fetch', '--unshallow', 'origin', ...spec];
    const fetched = run('git', args, CONSUMER, { allowFail: true });
    if (fetched.code !== 0 && depth === 0) {
      // --unshallow errors on an already-complete repo, which is success here
      run('git', ['fetch', 'origin', ...spec], CONSUMER, { allowFail: true });
    }
    const base = run('git', ['rev-parse', `origin/${opts.baseline}`], CONSUMER, {
      allowFail: true,
      capture: true,
    });
    if (base.code !== 0) continue;
    const anc = run('git', ['merge-base', '--is-ancestor', base.out.trim(), 'HEAD'], CONSUMER, {
      allowFail: true,
    });
    if (anc.code !== 0 && anc.code !== 1) continue;
    const behindRun = run('git', ['rev-list', '--count', `HEAD..${base.out.trim()}`], CONSUMER, {
      allowFail: true,
      capture: true,
    });
    outcome = baselineVerdict({
      ancestorCode: anc.code,
      behind: behindRun.code === 0 ? behindRun.out.trim() : null,
      ref: opts.ref,
      baseline: opts.baseline,
    });
    break;
  }
  const { ok, detail } =
    outcome ?? baselineVerdict({ ancestorCode: 2, ref: opts.ref, baseline: opts.baseline });
  record(`${opts.ref} has taken ${opts.baseline} back`, ok, detail);
}

// 5. Install the consumer's own dependencies, then overwrite junoui with the
//    candidate tarball.
//
//    --no-save, then a hard git restore of the manifest: `npm install <tgz>`
//    would otherwise rewrite the dependency spec to a `file:` path, and
//    junouiPin.test.ts fails on exactly that. The gate must not manufacture the
//    failure it is testing for.
head('install the consumer, then swap in the candidate');
run('npm', ['ci'], pkgDir);
run('npm', ['install', `${opts.as}@file:${tgz}`, '--no-save', '--ignore-scripts'], pkgDir);
run('git', ['checkout', '--', 'package.json', 'package-lock.json'], pkgDir);

const linkPath = join(pkgDir, 'node_modules', opts.as);
const st = lstatSync(linkPath, { throwIfNoEntry: false });
if (!st) die(`${opts.as} is not installed at ${linkPath}`);
// A symlink here means the tarball was not what got tested — the whole premise
// of this gate. Refuse rather than report a meaningless pass.
if (st.isSymbolicLink()) die(`${linkPath} is a symlink — the candidate must be installed unpacked`);
const installed = JSON.parse(readFileSync(join(linkPath, 'package.json'), 'utf8'));
record(
  'the consumed junoui is the packed candidate',
  installed.version === junouiPkg.version && installed.name === junouiPkg.name,
  `${installed.name}@${installed.version}`,
);

// 6. The gate proper. Three commands, all against the consumed candidate.
//
//    Three of nexora's tests read the CONSUMED junoui build rather than a copy
//    of its source, and they are why this works at all:
//      web/src/viewportFit.test.ts — reads node_modules/junoui/dist/css/juno.css
//        and asserts the iOS standalone letterbox unlock is in it.
//      web/src/appIcons.test.ts    — resolves `junoui/icons` and asserts every
//        icon the app draws exists as a <symbol> in the consumed sprite.
//      web/src/junouiPin.test.ts   — asserts the dependency is still an `npm:`
//        spec, i.e. that nothing (including this gate) left a machine-local path
//        in the manifest.
head('run the consumer guards against the candidate');
for (const [name, cmd, args] of [
  ['tsc --noEmit', 'npx', ['tsc', '--noEmit']],
  ['npm test', 'npm', ['test']],
  ['npm run build', 'npm', ['run', 'build']],
]) {
  const r = run(cmd, args, pkgDir, { allowFail: true });
  record(name, r.code === 0, r.code === 0 ? '' : `exit ${r.code}`);
}

// ------------------------------------------------------------------ verdict

if (!opts.keep) {
  rmSync(STAGE, { recursive: true, force: true });
  rmSync(tgz, { force: true });
}

const failed = results.filter((r) => !r.ok);
console.log('\n\x1b[1m── verdict\x1b[0m');
console.log(`   junoui   ${junouiPkg.name}@${junouiPkg.version}  ${junouiSha}`);
console.log(`   nexora   ${opts.ref}  ${consumerSha}`);
for (const r of results)
  console.log(`   ${r.ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${r.name}`);

if (failed.length) {
  console.log(
    `\n\x1b[31m   GATE RED — ${failed.length} of ${results.length} stages failed. This release is blocked.\x1b[0m`,
  );
  console.log('   A red consumer gate stops the release; it is not a note on it.');
  process.exit(1);
}
console.log(`\n\x1b[32m   GATE GREEN — ${results.length} stages passed.\x1b[0m`);
console.log('   Paste the two SHAs above onto the release ticket.');
