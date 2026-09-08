// Build identity (20260908-008, narrowed from 20260811-019): a build says
// which commit produced it, so "is my change live?" is answerable from the
// app instead of by reading files. Verified against the artefact and the
// live git state, not just re-derived and trusted — a flag never seen to
// change is not a flag, so `dirty` is flipped both ways here, not just read
// once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function rebuildIdentity() {
  execFileSync('node', ['scripts/build-identity.mjs'], { encoding: 'utf8' });
}

async function readIdentity() {
  // Bust the ESM cache with a query string — the same module specifier
  // would otherwise return the pre-rebuild import forever within one test
  // process, which would make the dirty-flip assertions below pass for the
  // wrong reason (reading a stale cached module, not the freshly built one).
  const mod = await import(`../dist/js/identity.js?t=${Date.now()}-${Math.random()}`);
  return mod.IDENTITY;
}

test('a build outside a git checkout says so unmistakably, not with a plausible-looking null', async () => {
  // Actually exercises the no-git path, rather than grepping the generator
  // for the word "gitAvailable": a fake `git` on PATH that always fails
  // stands in for "no git metadata available" (missing binary, unpacked
  // tarball, no .git) without touching this repo's real .git directory,
  // which would be unsafe to rename/move mid-session.
  const scratchDir = resolve('.identity-notgit-scratch');
  const fakeBinDir = join(scratchDir, 'bin');
  rmSync(scratchDir, { recursive: true, force: true });
  mkdirSync(fakeBinDir, { recursive: true });
  const fakeGit = join(fakeBinDir, 'git');
  writeFileSync(fakeGit, '#!/bin/sh\nexit 1\n');
  chmodSync(fakeGit, 0o755);

  try {
    execFileSync('node', [resolve('scripts/build-identity.mjs')], {
      cwd: scratchDir,
      env: { ...process.env, PATH: `${fakeBinDir}:${process.env.PATH}` },
    });
    const outPath = join(scratchDir, 'dist', 'js', 'identity.js');
    assert.ok(
      existsSync(outPath),
      'the generator did not write dist/js/identity.js under the fake-git scratch dir',
    );
    const mod = await import(`file://${outPath}?t=${Date.now()}`);
    assert.deepEqual(mod.IDENTITY, {
      gitAvailable: false,
      commit: null,
      branch: null,
      dirty: null,
      builtAt: mod.IDENTITY.builtAt, // asserted separately below
    });
    assert.ok(
      new Date(mod.IDENTITY.builtAt).getTime() > 0,
      'builtAt must still be a real timestamp even with no git',
    );
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
});

test('rebuilding produces a commit that matches git rev-parse HEAD at that moment', async () => {
  rebuildIdentity();
  const identity = await readIdentity();
  assert.equal(
    identity.gitAvailable,
    true,
    'this checkout is a real git tree; gitAvailable should be true here',
  );
  assert.equal(identity.commit, git(['rev-parse', 'HEAD']));
  assert.equal(identity.branch, git(['rev-parse', '--abbrev-ref', 'HEAD']));
});

test('dirty flips true when the tree is made dirty, and back to false when cleaned — seen both ways, not just read once', async () => {
  // Isolated in its own throwaway git repo rather than asserted against
  // this lane's own working tree, which can legitimately be dirty from
  // unrelated in-progress work (it is, right now) — that would force this
  // test to either skip half its assertions or fail for a reason that has
  // nothing to do with the identity module. A fresh repo is deterministic
  // regardless of ambient state.
  const scratchRepo = resolve('.identity-dirty-scratch');
  rmSync(scratchRepo, { recursive: true, force: true });
  mkdirSync(scratchRepo, { recursive: true });
  const scriptPath = resolve('scripts/build-identity.mjs');

  const runGit = (args) => execFileSync('git', args, { cwd: scratchRepo, encoding: 'utf8' }).trim();
  const rebuildInScratch = () => execFileSync('node', [scriptPath], { cwd: scratchRepo });
  const readScratchIdentity = async () => {
    const mod = await import(
      `file://${join(scratchRepo, 'dist', 'js', 'identity.js')}?t=${Date.now()}-${Math.random()}`
    );
    return mod.IDENTITY;
  };

  try {
    runGit(['init', '-q']);
    runGit(['config', 'user.email', 'test@example.invalid']);
    runGit(['config', 'user.name', 'identity-test']);
    // dist/ is gitignored in the real repo (CLAUDE.md hard rule 1); match
    // that here, or the generator's own output from each rebuild below
    // shows up as an untracked change and every read after the first looks
    // permanently dirty regardless of the untracked.txt mutation this test
    // is actually trying to isolate.
    writeFileSync(join(scratchRepo, '.gitignore'), 'dist/\n');
    writeFileSync(join(scratchRepo, 'README.md'), 'scratch repo for 20260908-008\n');
    runGit(['add', '.gitignore', 'README.md']);
    runGit(['commit', '-q', '-m', 'initial']);

    rebuildInScratch();
    const clean = await readScratchIdentity();
    assert.equal(clean.gitAvailable, true);
    assert.equal(clean.dirty, false, 'freshly committed scratch repo is clean but dirty read true');

    // Assert the mutation is actually present before trusting the next
    // read — a write that silently failed would leave the tree looking
    // clean and this test would pass for the wrong reason.
    const scratchFile = join(scratchRepo, 'untracked.txt');
    writeFileSync(scratchFile, 'making the scratch tree dirty\n');
    assert.equal(
      existsSync(scratchFile),
      true,
      'the scratch file failed to write — mutation not present',
    );
    assert.match(
      runGit(['status', '--porcelain']),
      /untracked\.txt/,
      'git does not see the scratch file as a change',
    );

    rebuildInScratch();
    const dirty = await readScratchIdentity();
    assert.equal(
      dirty.dirty,
      true,
      'the scratch tree has an untracked file but dirty read false — the flag never changed',
    );

    rmSync(scratchFile);
    assert.equal(
      existsSync(scratchFile),
      false,
      'cleanup itself failed — the next read would be testing a still-dirty tree',
    );

    rebuildInScratch();
    const cleanAgain = await readScratchIdentity();
    assert.equal(cleanAgain.dirty, false, 'scratch tree was cleaned but dirty still read true');

    // Also the positive control for the commit/branch fields, inside the
    // same isolated repo.
    assert.equal(cleanAgain.commit, runGit(['rev-parse', 'HEAD']));
  } finally {
    rmSync(scratchRepo, { recursive: true, force: true });
  }
});

test('builtAt is a fresh ISO timestamp each rebuild, not a cached or stale one', async () => {
  rebuildIdentity();
  const first = await readIdentity();
  await new Promise((r) => setTimeout(r, 5));
  rebuildIdentity();
  const second = await readIdentity();
  assert.ok(new Date(first.builtAt).getTime() > 0, 'builtAt is not a valid timestamp');
  assert.ok(
    new Date(second.builtAt).getTime() >= new Date(first.builtAt).getTime(),
    'a later rebuild produced an earlier builtAt',
  );
});
