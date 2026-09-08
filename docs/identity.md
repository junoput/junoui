# Build identity

junoui's build says which commit produced it, so "is my change live?" is a
question a consumer can ask the app instead of one answered by reading files
(ticket 20260908-008, narrowed from 20260811-019 — the container/HTTP-dev-
server half of that ticket was declined; this covers only the surviving
requirement).

## Usage

```js
import { IDENTITY } from 'junoui/identity';

console.log(IDENTITY);
// {
//   gitAvailable: true,
//   commit: "37fddad3389e7e852706404184f32c2ab4da2ef1",
//   branch: "main",
//   dirty: false,
//   builtAt: "2026-09-08T06:23:25.995Z"
// }
```

Generated at build time into `dist/js/identity.js` by
`scripts/build-identity.mjs`, wired into `npm run build`.

## Reading the fields correctly — the part that gets got wrong

`commit`, `branch` and `dirty` describe **the tree at build time**, never
"now". Those are different moments, and only the first is knowable from a
value baked into a generated file at build time. A consumer importing this
module weeks after the build gets an accurate answer to "what tree produced
this artefact" — it can never answer "is the tree dirty right now", because
that question needs a live `git` call in the tree you actually mean, not this
constant. `builtAt` is a **build** timestamp for the same reason: not a
publish timestamp, not an install timestamp — those can all be different
moments for the same artefact.

## `gitAvailable: false` — the honest-absence case

A build can run outside a git checkout: an unpacked npm tarball, some CI
shallow-clone configurations, a container image with no `.git` at all. When
that happens, `commit`/`branch`/`dirty` are `null` — but the module does not
stop there, because three `null`s alone are indistinguishable from "clean and
known" written carelessly. `gitAvailable: false` is the one explicit flag
that makes the absence unmistakable rather than plausible-looking.

## Showcase

The showcase footer displays the build identity for the running demo
(`showcase/app.js`), the same value a consumer would import — so the
standalone app answers "is my change live?" too, not only a consumer's own
build.

## What this does not cover

- **No HTTP endpoint, no container, no supervisor.** `20260811-019`'s
  container/dev-server requirements were declined — see that ticket's
  2026-09-08 comments for why its premise expired (the npm `file:` link it
  was filed to fix no longer exists on any branch).
- **A `dirty` reading of the CONSUMER's own tree.** This module only ever
  describes junoui's own tree at the moment junoui was built — it has no way
  to see, and does not attempt to answer anything about, whatever tree
  imported it.
