# The pre-release consumer gate

**Before any `npm publish` of junoui, one command must be green:**

```sh
npm run gate:consumer
```

It packs the release candidate, installs that tarball into a throwaway checkout of a
real consumer (the nexora web client, `ios/develop`), and runs that consumer's
typecheck, test suite and production build against it. **If it exits non-zero the
release is blocked** — see [Pass/fail](#passfail).

---

## Why this exists

junoui's own CI proves junoui builds. Nothing in it proved a junoui _release_ still
compiles into an app that consumes it. Until this gate, the release path was
`npm ci → build → visual → changesets → npm publish`: a version reached the registry
having never been compiled into a single application.

Two releases in one week shipped defects that only a consumer build could see.

**`0.4.0` shipped without `tools/subset-sprite.mjs`.** nexora's `web/vite.config.ts`
does `import { subsetSprite } from 'junoui/subset'`. The export had been added to
`package.json` `exports` and the `tools` directory was never added to `files` — so the
exports entry existed, pointed at a path, and the path shipped in nothing. Every junoui
check was green; the tarball was broken. Caught by hand minutes before a merge that
would have broken nexora's `develop` build.

**The icon subsetting work found two icons nexora draws that junoui's sprite does not
define** — `cloud-slash`, and `image` where junoui ships `images`. Both rendered as an
empty `<svg>` in the running app. Nobody had noticed.

Neither defect is visible from inside this repo. Both are one consumer build away.

## What it does, in order

| #   | Stage                                             | What it proves                                                                                             |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | `npm run build`                                   | the candidate's `dist/` is fresh, as `prepare` would make it before a publish                              |
| 2   | stage a pack source                               | a **copy** of the tree under `.relgate/pack-src` — the working tree is never mutated                       |
| 3   | `npm pack --ignore-scripts`                       | produces the exact artefact a consumer receives                                                            |
| 4   | preflight                                         | every target in the `exports` map is actually **inside the tarball** — the `0.4.0` defect, stated directly |
| 5   | shallow clone the consumer                        | `nexora` `ios/develop`, into `.relgate/nexora`                                                             |
| 6   | `npm ci`, then install the tarball                | the consumer's real dependency tree, with junoui replaced by the candidate                                 |
| 7   | `npx tsc --noEmit` · `npm test` · `npm run build` | the candidate compiles, passes the consumer's guards, and builds a production bundle                       |

Every stage is reported PASS/FAIL and the verdict block prints the **junoui SHA** and
the **nexora SHA** the run was checked against. Paste both onto the release ticket.

## It packs; it does not link

This is the constraint that makes the gate worth running.

nexora's iOS lane normally consumes junoui through a symlink
(`web/scripts/link-junoui.sh`) so junoui edits hot-reload into the app. That symlink is
the right tool for development and the **wrong** one for a release gate: it resolves the
whole worktree, so `tools/subset-sprite.mjs` would have been present in a candidate that
did not ship it. A linked gate passes the exact release this gate exists to stop. The
same holds for a `file:` dependency, which npm implements as that same symlink.

What a consumer receives is a tarball. So a tarball is what gets tested — file list,
`exports` map and built `dist` together. The gate asserts this rather than assuming it:
if `node_modules/junoui` in the consumer turns out to be a symlink, the run aborts
instead of reporting a meaningless pass.

## The three guards that make this work

nexora carries three tests that read the **consumed junoui build** rather than a copy of
its source. They are why running the consumer's suite says anything about a junoui
candidate at all:

- **`web/src/viewportFit.test.ts`** — reads `node_modules/junoui/dist/css/juno.css` and
  asserts the iOS standalone letterbox unlock is present in it (the
  `(display-mode: standalone) and (pointer: coarse)` block, `-webkit-touch-callout`,
  `body::after`, `100lvh + 80px`). A junoui release that drops or refactors that unlock
  fails here instead of on a phone.
- **`web/src/appIcons.test.ts`** — resolves `junoui/icons`, parses the sprite, and
  asserts every icon name the app draws exists as a `<symbol>` in it. This is the guard
  that would have caught `cloud-slash` and `image`/`images`.
- **`web/src/junouiPin.test.ts`** — asserts the dependency spec is still `npm:` on every
  branch, i.e. that no machine-local `file:`/`link:` path reached the manifest. The gate
  installs with `--no-save` and then hard-restores `package.json`/`package-lock.json`
  from git precisely so it does not manufacture the failure it is testing for.

`npm run build` additionally exercises `junoui/subset` through vite's config load, which
is where the `0.4.0` defect surfaces.

## Pass/fail

**A red consumer gate blocks the release. It is not a note on the release.**

The script exits non-zero if any stage fails, and prints
`GATE RED — n of m stages failed. This release is blocked.` A gate that reports and
proceeds is a log line, not a gate: fix the candidate, or drop the change from the
release, then run it again.

## Where it runs, and why not in CI

**It runs locally, on devbox, invoked by whoever cuts the release** — as the step
between "the changeset is ready" and the publish checkpoint with the orchestrator.

The honest reason is that it needs a consumer, and this box is where the consumer lives.
The gate is not currently a GitHub Actions job and the README should not imply it is.

Could it become one? The clone is `git@github.com:junoput/nexora.git`, which a
GitHub-hosted runner can reach — so the blocker is not `/work`, it is credentials:
nexora is a **private** repo, so junoui's workflow would need a deploy key or a fine-
grained PAT with read access to a second repository, stored as a junoui secret. That is
a real, standing cross-repo credential added to a public-publishing workflow that already
carries `provenance: true` and an npm token. The judgement here is that the trade is not
worth it _yet_: the gate takes about two minutes, releases are cut by hand at a
checkpoint anyway, and the credential would be the most privileged thing in this repo's
CI. If nexora ever goes public, or if releases stop being hand-cut, revisit it — the
script takes `--repo` and `--ref` for exactly that reason and needs no other change.

## Also required: a device pass for anything the headless build cannot see

The gate is a build. It cannot see layout. For any release touching **viewport,
safe-area, overlays, or anything under `(pointer: coarse)`**, also do a device pass on
the iOS lane UI at `http://100.123.18.125:20100/` (Home-Screen standalone, not the Safari
tab — the letterbox behaviour only exists in standalone). Record it on the release ticket
alongside the two SHAs.

## Proving the gate can fail

A gate that has never failed and a gate that _cannot_ fail look identical from outside.
This one reproduces the `0.4.0` defect on demand:

```sh
npm run gate:consumer -- --drop-files tools     # pack a candidate WITHOUT tools/
```

That flag rewrites `files` in the **staged copy** only — the real `package.json` is never
touched — and packs a candidate with `exports["./subset"]` pointing at a file the tarball
does not contain. Expected result: three red stages (`preflight`, `npm test`,
`npm run build`), exit code 1, with

```
Cannot find module '.../node_modules/junoui/tools/subset-sprite.mjs'
imported from '.../web/vite.config.ts'
```

which is, verbatim, the failure nexora's `develop` was minutes from taking.

Use the flag as an acceptance check when changing this script. Never as part of a real
release run.

## Options

```
--ref <branch>       consumer branch to check against   (default: ios/develop)
--repo <url>         consumer repository                (default: git@github.com:junoput/nexora.git)
--subdir <path>      package dir inside the consumer    (default: web)
--as <name>          dependency name to install under   (default: junoui)
--no-build           skip `npm run build`, pack the dist/ already present
--keep               keep the staged pack source and the tarball
--drop-files <entry> ACCEPTANCE ONLY — remove an entry from `files` before packing
```

## What it never touches

Everything the gate writes lives under `<junoui>/.relgate/`, which is gitignored: the
staged pack source, the candidate tarball, and the throwaway consumer clone. The paths
are asserted, not merely intended — the script refuses any target outside that directory
and refuses to follow a symlink out of it.

In particular it **never writes to `/work/ios/nexora`**. That worktree is the live
integration environment behind the operator's bookmarked `:20100` UI; an `npm install` or
a swapped `node_modules/junoui` in it is immediately visible as "my changes stopped
showing". If the clone in step 5 is ever unavailable, stop and say so — do not reach for
the live worktree.

## After the publish: take the release back

The changesets action runs on `main`. It bumps `package.json`, writes the
CHANGELOG, and **deletes the changesets it consumed** — on `main` only. Every
other branch keeps the old version and the consumed changeset files.

So a branch that has not merged `main` back is one `changeset version` away from
computing the next version off a stale base and republishing entries that
already shipped. That is not a hypothetical: minutes after `0.6.0` published,
`develop` and `ios/develop` both still read `0.5.0` and still carried all five
consumed changesets (ticket 20260815-053).

```sh
git checkout develop && git merge origin/main   # then push, and onward to any lane branch
```

**The gate asserts this so nobody has to remember it.** `npm run gate:consumer`
fails when `origin/main` is not an ancestor of `HEAD`, and when the version in
`package.json` is already on the registry — the second being the sign that
`changeset version` has not run yet for the release you are about to pack. Pass
`--dev` when you are checking a consumer build mid-development rather than
cutting a release: the already-published condition then reports instead of
blocking, and the ancestor check still fails, because a branch missing the last
release is wrong for any purpose.

Prose in a runbook is a rule someone has to remember at the exact moment they
are least likely to be reading the runbook. The check is the version that holds.
